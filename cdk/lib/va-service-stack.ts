import * as cdk from 'aws-cdk-lib'
import { Duration } from 'aws-cdk-lib'
import { Environment } from './va-env-stage'
import {
  AppProtocol,
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
} from 'aws-cdk-lib/aws-ecs'
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import {
  ApplicationListenerRule,
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ApplicationTargetGroup,
  ListenerAction,
  ListenerCondition,
  XffHeaderProcessingMode,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { LogGroup } from 'aws-cdk-lib/aws-logs'
import type { VaSecurityGroups } from './security-group-stack'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { BucketDeployment, CacheControl, Source } from 'aws-cdk-lib/aws-s3-deployment'
import * as path from 'node:path'
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  OriginAccessIdentity,
  OriginRequestPolicy,
  SSLMethod,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import { AWS_SERVICE_PREFIX } from '../bin/cdk'

const CONTAINER_NAME = 'valtionavustukset'
export const VIRKAILIJA_PORT = 8081 // = virkailija port
export const HAKIJA_PORT = 8080 // hakija port

interface VaServiceStackProps extends cdk.StackProps {
  vpc: cdk.aws_ec2.Vpc
  cluster: Cluster
  db: DbProps
  applicationLogGroup: LogGroup
  securityGroups: VaSecurityGroups
  domains: Domains
}

interface DbProps {
  hostname: string
  passwordSecret: Secret
}

interface Domains {
  hakijaDomain: string
  hakijaDomainSv: string
  virkailijaDomain: string
}

export class VaServiceStack extends cdk.Stack {
  cdnDistribution: Distribution

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
      command: ['run', '-m', 'oph.va.hakija.main'],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8081/api/healthcheck || exit 1'],
        startPeriod: Duration.minutes(5),
      },
      containerName: CONTAINER_NAME,
      environment: {
        JAVA_TOOL_OPTIONS:
          '-Dlog4j2.formatMsgNoLookups=true -Dfile.encoding=UTF-8 -Djava.awt.headless=true -Dclojure.main.report=stderr',
        DB_HOSTNAME: databaseHostname,
        HEADLESS: 'true',
        config: `/app/server/config/aws-${scope.env}.edn`,
        configdefaults: '/app/server/config/aws-defaults.edn',
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
          name: 'hakija',
          containerPort: HAKIJA_PORT,
          hostPort: HAKIJA_PORT,
          appProtocol: AppProtocol.http,
        },

        {
          name: 'virkailija',
          containerPort: VIRKAILIJA_PORT,
          hostPort: VIRKAILIJA_PORT,
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

    /* ---------- LOAD BALANCER ---------- */

    const loadBalancer = new ApplicationLoadBalancer(this, 'va-load-balancer', {
      loadBalancerName: 'va-service',
      securityGroup: albSecurityGroup,
      xffHeaderProcessingMode: XffHeaderProcessingMode.APPEND,
      internetFacing: true,
      vpc: vpc,
      preserveHostHeader: true,
    })

    const loadbalancerListener = loadBalancer.addListener('lb-http-listener', {
      protocol: ApplicationProtocol.HTTP,
      port: 80,
      open: true,
    })

    const virkailijaTargetGroup = new ApplicationTargetGroup(
      this,
      'va-virkailija-alb-target-group',
      {
        vpc: vpc,
        protocol: ApplicationProtocol.HTTP,
        port: VIRKAILIJA_PORT,
        targets: [
          vaService.loadBalancerTarget({
            containerName: CONTAINER_NAME,
            containerPort: VIRKAILIJA_PORT,
          }),
        ],
        healthCheck: {
          enabled: true,
          interval: Duration.seconds(30),
          path: '/api/healthcheck',
          port: `${VIRKAILIJA_PORT}`,
        },
      }
    )

    /* ---------- HAKIJA LOAD BALANCER ---------- */

    const hakijaTargetGroup = new ApplicationTargetGroup(this, 'va-hakija-alb-target-group', {
      vpc: vpc,
      protocol: ApplicationProtocol.HTTP,
      port: HAKIJA_PORT,
      targets: [
        vaService.loadBalancerTarget({
          containerName: CONTAINER_NAME,
          containerPort: HAKIJA_PORT,
        }),
      ],
      healthCheck: {
        enabled: true,
        interval: Duration.seconds(30),
        path: '/api/healthcheck',
        port: `${HAKIJA_PORT}`,
      },
    })

    const { hakijaDomain, hakijaDomainSv, virkailijaDomain } = props.domains

    /*  ---------- VIRKAILIJA FQDN ---------- */
    //  aws.dev.virkailija.valtionavustukset.oph.fi
    new ApplicationListenerRule(this, 'route-to-virkailija-from-host-headers', {
      listener: loadbalancerListener,
      priority: 10,
      action: ListenerAction.forward([virkailijaTargetGroup]),
      conditions: [ListenerCondition.hostHeaders([`${AWS_SERVICE_PREFIX}${virkailijaDomain}`])],
    })

    /* ---------- HAKIJA FQDN ---------- */
    // aws.dev.valtionavustukset.oph.fi
    // aws.dev.statsunderstod.oph.fi
    loadbalancerListener.addAction('route-to-hakija-as-default', {
      action: ListenerAction.forward([hakijaTargetGroup]),
    })

    /* ------------------------------ CDN -------------------------------- */

    const bucketName = `oph-va-maintenance-page-${scope.env}`
    const maintenancePageBucket = new Bucket(this, 'maintenance-page-bucket', {
      bucketName: bucketName,
    })

    new BucketDeployment(this, 'maintenance-page-bucket-deployment', {
      destinationBucket: maintenancePageBucket,
      sources: [Source.asset(path.join(__dirname, 'assets/maintenance-page'))],
      cacheControl: [CacheControl.noCache()],
      destinationKeyPrefix: 'maintenance-page/', // This must match with CDN "path pattern"
    })

    const oai = new OriginAccessIdentity(this, 'cdn-oai')
    maintenancePageBucket.grantRead(oai)

    this.cdnDistribution = new Distribution(this, 'va-cdn', {
      /*
      domainNames: [
        `${AWS_SERVICE_PREFIX}${hakijaDomain}`,
        `${AWS_SERVICE_PREFIX}${hakijaDomainSv}`,
        `${AWS_SERVICE_PREFIX}${virkailijaDomain}`,
      ],
      sslSupportMethod: SSLMethod.SNI,
      */
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(loadBalancer),
        allowedMethods: AllowedMethods.ALLOW_ALL,
        originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
        cachePolicy: CachePolicy.CACHING_DISABLED,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      errorResponses: [
        { httpStatus: 500, responsePagePath: '/maintenance-page/index.html' },
        { httpStatus: 502, responsePagePath: '/maintenance-page/index.html' },
        { httpStatus: 503, responsePagePath: '/maintenance-page/index.html' },
        { httpStatus: 504, responsePagePath: '/maintenance-page/index.html' },
      ],
      additionalBehaviors: {
        '/maintenance-page/*': {
          origin: new origins.S3Origin(maintenancePageBucket, {
            originAccessIdentity: oai,
          }),
          allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: CachePolicy.CACHING_DISABLED,
        },
      },
      enableIpv6: false,
    })
  }
}
