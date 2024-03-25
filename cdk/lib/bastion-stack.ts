import * as cdk from 'aws-cdk-lib'
import { aws_ec2 } from 'aws-cdk-lib'
import { Environment } from './va-env-stage'
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets'
import * as path from 'node:path'
import {
  Cluster,
  ContainerImage,
  CpuArchitecture,
  FargatePlatformVersion,
  FargateService,
  FargateTaskDefinition,
  LinuxParameters,
  LogDrivers,
  OperatingSystemFamily,
} from 'aws-cdk-lib/aws-ecs'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Effect, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { SecurityGroup } from 'aws-cdk-lib/aws-ec2'

export class BastionStack extends cdk.Stack {
  constructor(
    scope: Environment,
    id: string,
    cluster: Cluster,
    permitDbAccessSecurityGroup: SecurityGroup,
    props?: cdk.StackProps
  ) {
    super(scope, id, props)

    const bastionImageAsset = new DockerImageAsset(this, 'BastionImage', {
      assetName: 'BastionImage',
      directory: path.join(__dirname, 'assets'),
      file: 'Dockerfile.bastion',
      platform: Platform.LINUX_ARM64,
    })

    const bastionTaskDef = new FargateTaskDefinition(this, 'BastionTaskDef', {
      family: 'bastion',
      cpu: 256,
      memoryLimitMiB: 512,
      runtimePlatform: {
        cpuArchitecture: CpuArchitecture.ARM64,
        operatingSystemFamily: OperatingSystemFamily.LINUX,
      },
    })

    const bastionLogGroup = new LogGroup(this, 'bastion-log-group', {
      logGroupName: '/fargate/bastion',
      retention: RetentionDays.SIX_MONTHS,
    })

    bastionTaskDef.addContainer('BastionContainer', {
      containerName: 'bastion-container',
      image: ContainerImage.fromDockerImageAsset(bastionImageAsset),
      linuxParameters: new LinuxParameters(this, 'Bastion-Linux-Parameters', {
        initProcessEnabled: true,
      }),
      logging: LogDrivers.awsLogs({
        streamPrefix: 'fargate',
        logGroup: bastionLogGroup,
      }),
    })

    const ssmMessagesPolicy = new Policy(this, 'ssm-messages-policy', {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'ssmmessages:CreateControlChannel',
            'ssmmessages:CreateDataChannel',
            'ssmmessages:OpenControlChannel',
            'ssmmessages:OpenDataChannel',
          ],
          resources: ['*'],
        }),
      ],
    })

    bastionTaskDef.taskRole.attachInlinePolicy(ssmMessagesPolicy)

    const bastionService = new FargateService(this, 'BastionService', {
      serviceName: 'bastion',
      cluster,
      taskDefinition: bastionTaskDef,
      securityGroups: [permitDbAccessSecurityGroup],
      desiredCount: 1,
      enableExecuteCommand: true,
      assignPublicIp: false, // Use SSM to connect
      vpcSubnets: { subnetType: aws_ec2.SubnetType.PRIVATE_WITH_EGRESS },
      platformVersion: FargatePlatformVersion.VERSION1_4, // Contains ECS Exec prerequisites
    })

    bastionLogGroup.grantWrite(bastionTaskDef.taskRole)
  }
}
