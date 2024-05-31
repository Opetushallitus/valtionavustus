import * as cdk from 'aws-cdk-lib'
import { Duration } from 'aws-cdk-lib'
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
  Secret as EcsSecret,
  UlimitName,
  AppProtocol,
} from 'aws-cdk-lib/aws-ecs'
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { DB_NAME as VA_DATABASE_NAME } from './db-stack'
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ApplicationTargetGroup,
  XffHeaderProcessingMode,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { LogGroup } from 'aws-cdk-lib/aws-logs'
import type { VaSecurityGroups } from './security-group-stack'

const CONTAINER_NAME = 'valtionavustukset'
export const VIRKAILIJA_PORT = 8081 // = virkailija port
export const HAKIJA_PORT = 8080 // hakija port

interface VaServiceStackProps extends cdk.StackProps {
  vpc: cdk.aws_ec2.Vpc
  cluster: Cluster
  db: DbProps
  applicationLogGroup: LogGroup
  securityGroups: VaSecurityGroups
}

interface DbProps {
  hostname: string
  passwordSecret: Secret
}

export class VaServiceStack extends cdk.Stack {
  constructor(scope: Environment, id: string, props: VaServiceStackProps) {
    super(scope, id, props)

    const { vpc, cluster, db, applicationLogGroup, securityGroups } = props
    const { hostname: databaseHostname, passwordSecret: databasePasswordSecret } = db
    const { vaServiceSecurityGroup, dbAccessSecurityGroup, albSecurityGroup } = securityGroups

    /* ---------- FARGATE SERVICE ---------- */

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

    const valtionavustuksetImage = ContainerImage.fromRegistry(
      `ghcr.io/opetushallitus/va-server:${scope.currentGitRevision}`
    )

    taskDefinition.addContainer('valtionavustukset-container', {
      image: valtionavustuksetImage,
      command: ['with-profile', 'server-dev', 'run', '-m', 'oph.va.hakija.main'],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8081/api/healthcheck || exit 1'],
        startPeriod: Duration.minutes(5),
      },
      containerName: CONTAINER_NAME,
      environment: {
        DB_HOSTNAME: databaseHostname,
        DB_USERNAME: 'va_application',
        DB_NAME: VA_DATABASE_NAME,
      },
      secrets: {
        DB_PASSWORD: EcsSecret.fromSecretsManager(databasePasswordSecret),
      },
      logging: LogDriver.awsLogs({
        streamPrefix: 'fargate',
        logGroup: applicationLogGroup,
      }),
      portMappings: [
        {
          name: 'virkailija',
          containerPort: VIRKAILIJA_PORT,
          hostPort: VIRKAILIJA_PORT,
          appProtocol: AppProtocol.http,
        },
        {
          name: 'hakija',
          containerPort: HAKIJA_PORT,
          hostPort: HAKIJA_PORT,
          appProtocol: AppProtocol.http,
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

    const vaService = new FargateService(this, 'va-service', {
      serviceName: 'valtionavustukset',
      desiredCount: 1,
      maxHealthyPercent: 100, // ensure max one process is running even during deployment
      minHealthyPercent: 0, // ensure max one process is running even during deployment
      cluster: cluster,
      taskDefinition: taskDefinition,
      vpcSubnets: { subnets: vpc.privateSubnets },
      securityGroups: [vaServiceSecurityGroup, dbAccessSecurityGroup],
      enableExecuteCommand: true,
      circuitBreaker: { enable: true, rollback: true },
      deploymentController: { type: DeploymentControllerType.ECS },
      healthCheckGracePeriod: Duration.minutes(10),
    })

    /* ---------- VIRKAILIJA LOAD BALANCER ---------- */

    const virkailijaTargetGroup = new ApplicationTargetGroup(this, 'va-virkailija-target-group', {
      vpc: vpc,
      targets: [vaService],
      protocol: ApplicationProtocol.HTTP,
      port: VIRKAILIJA_PORT,
      healthCheck: {
        enabled: true,
        interval: Duration.seconds(30),
        path: '/api/healthcheck',
        port: `${VIRKAILIJA_PORT}`,
      },
    })

    const virkailijaLoadBalancer = new ApplicationLoadBalancer(
      this,
      'va-virkailija-load-balancer',
      {
        loadBalancerName: 'va-virkailija-service',
        securityGroup: albSecurityGroup,
        xffHeaderProcessingMode: XffHeaderProcessingMode.APPEND,
        internetFacing: true,
        vpc: vpc,
        preserveHostHeader: true,
      }
    )

    const virkailijaListener = virkailijaLoadBalancer.addListener('virkailija-lb-http', {
      protocol: ApplicationProtocol.HTTP,
      port: 80,
      defaultTargetGroups: [virkailijaTargetGroup],
      open: false, // Allow only Reaktor office for now, app is not configured properly yet
    })

    /* ---------- HAKIJA LOAD BALANCER ---------- */

    const hakijaTargetGroup = new ApplicationTargetGroup(this, 'va-hakija-target-group', {
      vpc: vpc,
      targets: [vaService],
      protocol: ApplicationProtocol.HTTP,
      port: HAKIJA_PORT,
      healthCheck: {
        enabled: true,
        interval: Duration.seconds(30),
        path: '/api/healthcheck',
        port: `${HAKIJA_PORT}`,
      },
    })

    const hakijaLoadBalancer = new ApplicationLoadBalancer(this, 'va-hakija-load-balancer', {
      loadBalancerName: 'va-hakija-service',
      securityGroup: albSecurityGroup,
      xffHeaderProcessingMode: XffHeaderProcessingMode.APPEND,
      internetFacing: true,
      vpc: vpc,
      preserveHostHeader: true,
    })

    const hakijaListener = hakijaLoadBalancer.addListener('hakija-lb-http', {
      protocol: ApplicationProtocol.HTTP,
      port: 80,
      defaultTargetGroups: [hakijaTargetGroup],
      open: false, // Allow only Reaktor office for now, app is not configured properly yet
    })
  }
}
