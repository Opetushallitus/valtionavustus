import * as cdk from 'aws-cdk-lib'
import { aws_kms, RemovalPolicy } from 'aws-cdk-lib'
import { Environment } from './va-env-stage'
import {
  Cluster,
  ContainerImage,
  CpuArchitecture,
  DeploymentControllerType,
  FargateService,
  FargateTaskDefinition,
  LogDriver,
  OperatingSystemFamily,
  UlimitName,
} from 'aws-cdk-lib/aws-ecs'
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { SecurityGroup } from 'aws-cdk-lib/aws-ec2'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'

export class VaServiceStack extends cdk.Stack {
  constructor(
    scope: Environment,
    id: string,
    vpc: cdk.aws_ec2.Vpc,
    cluster: Cluster,
    dbAccessSecurityGroup: cdk.aws_ec2.SecurityGroup,
    storageEncryptionKey: aws_kms.Key,
    databaseHostname: string,
    props?: cdk.StackProps
  ) {
    super(scope, id, props)

    const vaTaskRole = new Role(this, 'va-task-role', {
      roleName: 'valtionavustukset-ecs-task-role',
      description: 'Valtionavustukset application task role',
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
    })

    const vaTaskExecRole = new Role(this, 'va-task-exec-role', {
      roleName: 'valtionavustukset-ecs-task-exec-role',
      description: 'Valtionavustukset application task exec role',
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
    })

    const taskDefinition = new FargateTaskDefinition(this, 'va-task-def', {
      family: 'valtionavustukset',
      runtimePlatform: {
        cpuArchitecture: CpuArchitecture.X86_64,
        operatingSystemFamily: OperatingSystemFamily.LINUX,
      },
      taskRole: vaTaskRole,
      executionRole: vaTaskExecRole,
      cpu: 512,
      memoryLimitMiB: 1024,
    })

    const logGroup = new LogGroup(this, 'va-log-group', {
      logGroupName: '/fargate/valtionavustukset-application',
      encryptionKey: storageEncryptionKey,
      retention: RetentionDays.ONE_YEAR,
      removalPolicy: RemovalPolicy.RETAIN,
    })

    const valtionavustuksetImage = ContainerImage.fromRegistry(
      `ghcr.io/opetushallitus/va-server:${scope.currentGitRevision}`
    )

    taskDefinition.addContainer('valtionavustukset-container', {
      image: valtionavustuksetImage,
      command: ['with-profile', 'server-dev', 'run', '-m', 'oph.va.hakija.main'],
      containerName: 'valtionavustukset',
      environment: {
        DB_HOSTNAME: databaseHostname,
      },
      logging: LogDriver.awsLogs({
        streamPrefix: 'fargate',
        logGroup: logGroup,
      }),
      portMappings: [
        {
          name: 'http',
          containerPort: 80,
        },
      ],
      ulimits: [
        {
          name: UlimitName.NOFILE,
          softLimit: 8192,
          hardLimit: 8192,
        },
      ],
    })

    const securityGroup = new SecurityGroup(this, 'va-app-sg', {
      securityGroupName: 'valtionavustukset-app-sg',
      description: 'Valtionavustukset application security group',
      vpc: vpc,
      allowAllOutbound: true,
    })

    const vaService = new FargateService(this, 'va-service', {
      serviceName: 'valtionavustukset',
      desiredCount: 1,
      maxHealthyPercent: 100, // ensure max one process is running even during deployment
      minHealthyPercent: 0, // ensure max one process is running even during deployment
      cluster: cluster,
      taskDefinition: taskDefinition,
      vpcSubnets: { subnets: vpc.privateSubnets },
      securityGroups: [securityGroup, dbAccessSecurityGroup],
      enableExecuteCommand: true,
      circuitBreaker: { enable: true, rollback: true },
      deploymentController: { type: DeploymentControllerType.ECS },
      //healthCheckGracePeriod: Duration.seconds(30), TODO: Must create load balancer before setting this
    })
  }
}
