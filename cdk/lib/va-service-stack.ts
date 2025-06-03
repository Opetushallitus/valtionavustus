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
import { Domains, HostedZones } from './dns-stack'
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager'
import { LoadBalancerTarget } from 'aws-cdk-lib/aws-route53-targets'
import { ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { albIdleTimeoutValue } from './timeouts'

const CONTAINER_NAME = 'valtionavustukset'
export const VIRKAILIJA_PORT = 8081 // = virkailija port
export const HAKIJA_PORT = 8080 // hakija port

interface VaServiceStackProps extends cdk.StackProps {
  vpc: cdk.aws_ec2.Vpc
  cluster: Cluster
  databaseHostname: string
  applicationLogGroup: LogGroup
  loadBalancerAccessLogBucket: Bucket
  securityGroups: VaSecurityGroups
  domains: Pick<Domains, 'virkailijaDomain' | 'hakijaDomain'>
  zones: Pick<HostedZones, 'hakijaZone'>
  secrets: AppSecrets
}

interface AppSecrets {
  databasePassword: Secret
  pagerdutySecrets: Secret
  smtpSecrets: Secret
  vaultSecrets: Secret
}

export class VaServiceStack extends cdk.Stack {
  loadbalancer: ApplicationLoadBalancer
  loadbalancerARecord: ARecord

  constructor(scope: Environment, id: string, props: VaServiceStackProps) {
    super(scope, id, props)

    const { vpc, cluster, databaseHostname, applicationLogGroup, securityGroups } = props
    const { vaServiceSecurityGroup, dbAccessSecurityGroup, albSecurityGroup } = securityGroups
    const { hakijaDomain, virkailijaDomain } = props.domains
    const { hakijaZone } = props.zones
    const { databasePassword, pagerdutySecrets, smtpSecrets, vaultSecrets } = props.secrets

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
      cpu: 2048,
      memoryLimitMiB: 4096,
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
          '-Xmx2500m -Dlog4j2.formatMsgNoLookups=true -Dfile.encoding=UTF-8 -Djava.awt.headless=true -Dclojure.main.report=stderr -Duser.timezone=Europe/Helsinki',
        DB_HOSTNAME: databaseHostname,
        HEADLESS: 'true',
        config: `/app/server/config/aws-${scope.env}.edn`,
        configdefaults: '/app/server/config/aws-defaults.edn',
      },
      secrets: {
        DB_PASSWORD: EcsSecret.fromSecretsManager(databasePassword),
        PAGERDUTY_API_ENDPOINT: EcsSecret.fromSecretsManager(pagerdutySecrets, 'API_ENDPOINT'),
        PAGERDUTY_ROUTING_KEY: EcsSecret.fromSecretsManager(pagerdutySecrets, 'ROUTING_KEY'),
        SMTP_AUTH_USERNAME: EcsSecret.fromSecretsManager(smtpSecrets, 'SMTP_USERNAME'),
        SMTP_AUTH_PASSWORD: EcsSecret.fromSecretsManager(smtpSecrets, 'SMTP_PASSWORD'),
        SMTP_BOUNCE_ADDRESS: EcsSecret.fromSecretsManager(smtpSecrets, 'BOUNCE_ADDRESS'),
        CAS_SERVICE_USERNAME: EcsSecret.fromSecretsManager(vaultSecrets, 'CAS_SERVICE_USERNAME'),
        CAS_SERVICE_PASSWORD: EcsSecret.fromSecretsManager(vaultSecrets, 'CAS_SERVICE_PASSWORD'),
        OFFICER_EDIT_JWT_SECRET: EcsSecret.fromSecretsManager(
          vaultSecrets,
          'OFFICER_EDIT_JWT_SECRET'
        ),
        PAYMENT_SERVICE_HOST: EcsSecret.fromSecretsManager(vaultSecrets, 'PAYMENT_SERVICE_HOST'),
        PAYMENT_SERVICE_HOST_KEY: EcsSecret.fromSecretsManager(
          vaultSecrets,
          'PAYMENT_SERVICE_HOST_KEY'
        ),
        PAYMENT_SERVICE_USERNAME: EcsSecret.fromSecretsManager(
          vaultSecrets,
          'PAYMENT_SERVICE_USERNAME'
        ),
        PAYMENT_SERVICE_PASSWORD: EcsSecret.fromSecretsManager(
          vaultSecrets,
          'PAYMENT_SERVICE_PASSWORD'
        ),
        SERVER_COOKIE_KEY: EcsSecret.fromSecretsManager(vaultSecrets, 'SERVER_COOKIE_KEY'),
        EMAIL_TO_PALKEET: EcsSecret.fromSecretsManager(vaultSecrets, 'EMAIL_TO_PALKEET'),
        EMAIL_TO_TALOUSPALVELUT: EcsSecret.fromSecretsManager(
          vaultSecrets,
          'EMAIL_TO_TALOUSPALVELUT'
        ),
        EMAIL_TO_TUKI: EcsSecret.fromSecretsManager(vaultSecrets, 'EMAIL_TO_TUKI'),
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
    loadBalancer.logAccessLogs(props.loadBalancerAccessLogBucket)
    loadBalancer.setAttribute('idle_timeout.timeout_seconds', albIdleTimeoutValue.toString())

    const ALB_FQDN = `alb.${hakijaDomain}`
    this.loadbalancerARecord = new ARecord(this, 'alb-a-alias-record', {
      zone: hakijaZone,
      recordName: `${ALB_FQDN}.`,
      target: RecordTarget.fromAlias(new LoadBalancerTarget(loadBalancer)),
      comment: 'ALB A record "alias"',
    })

    const loadBalancerCertificate = new Certificate(this, 'ssl-certificate-alb', {
      domainName: ALB_FQDN,
      validation: CertificateValidation.fromDns(hakijaZone),
    })

    const loadbalancerListener = loadBalancer.addListener('lb-http-listener', {
      protocol: ApplicationProtocol.HTTPS,
      port: 443,
      open: true,
      certificates: [loadBalancerCertificate],
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

    /*  ---------- VIRKAILIJA FQDN ---------- */
    //  dev.virkailija.valtionavustukset.oph.fi
    new ApplicationListenerRule(this, 'route-to-virkailija-from-host-headers', {
      listener: loadbalancerListener,
      priority: 10,
      action: ListenerAction.forward([virkailijaTargetGroup]),
      conditions: [ListenerCondition.hostHeaders([virkailijaDomain])],
    })

    /* ---------- HAKIJA FQDN ---------- */
    // aws.dev.valtionavustukset.oph.fi
    // aws.dev.statsunderstod.oph.fi
    loadbalancerListener.addAction('route-to-hakija-as-default', {
      action: ListenerAction.forward([hakijaTargetGroup]),
    })

    this.loadbalancer = loadBalancer
  }
}
