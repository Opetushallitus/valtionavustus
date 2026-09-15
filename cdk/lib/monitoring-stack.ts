import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as cdk from 'aws-cdk-lib'
import { Duration } from 'aws-cdk-lib'
import {
  Alarm,
  AlarmRule,
  AlarmState,
  ComparisonOperator,
  CompositeAlarm,
  Metric,
  TreatMissingData,
} from 'aws-cdk-lib/aws-cloudwatch'
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions'
import { IBaseService } from 'aws-cdk-lib/aws-ecs'
import { Rule } from 'aws-cdk-lib/aws-events'
import { SnsTopic } from 'aws-cdk-lib/aws-events-targets'
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { Subscription, SubscriptionProtocol, Topic } from 'aws-cdk-lib/aws-sns'
import type { CfnCanary } from 'aws-cdk-lib/aws-synthetics'
import { Canary, Code, Runtime, RuntimeFamily, Schedule } from 'aws-cdk-lib/aws-synthetics'
import { Environment } from './va-env-stage'
import { Domains } from './cdn-stack'

interface MonitoringStackProps extends cdk.StackProps {
  domains: Domains
  service: IBaseService
  pagerdutySecret: Secret
}

// aws-cdk-lib 2.269.0 only ships constants up to syn-nodejs-3.1.
const CANARY_RUNTIME = new Runtime('syn-nodejs-5.2', RuntimeFamily.NODEJS)

const HEALTHCHECK_PATH = '/api/healthcheck'
const HEALTHCHECK_INTERVAL = Duration.minutes(5)

// ACM renews automatically 60 days before expiry, so anything still unrenewed
// this close to the deadline means renewal itself is broken.
const CERTIFICATE_EXPIRY_WARNING_DAYS = 14

// The task gets 2 vCPU and 4096 MiB, and -Xmx2500m caps the JVM's own footprint
// near 78% of that, so sustained use above this is something the heap can't explain.
const SATURATION_THRESHOLD_PERCENT = 85

const PUBLISHING_ALARM_NAMES = {
  siteUnreachable: 'valtionavustukset-site-unreachable-paging',
  certificateExpiring: 'valtionavustukset-certificate-expiring',
  cpuHigh: 'valtionavustukset-cpu-high',
  memoryHigh: 'valtionavustukset-memory-high',
}

// The blueprint schema requires stepName to match ^[a-zA-Z][a-zA-Z0-9_-]*$, so dots are out.
export const canaryStepName = (domain: string) => domain.replace(/\./g, '-')

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Environment, id: string, props: MonitoringStackProps) {
    super(scope, id, props)

    const { domains, service, pagerdutySecret } = props

    const alarmTopic = new Topic(this, 'alarm-topic', {
      topicName: 'valtionavustukset-alarms',
    })

    // Allow every CloudWatch alarm in this account to publish to the shared alarm topic.
    alarmTopic.grantPublish(
      new ServicePrincipal('cloudwatch.amazonaws.com').withConditions({
        StringEquals: { 'aws:SourceAccount': this.account },
      })
    )

    new Subscription(this, 'pagerduty-subscription', {
      topic: alarmTopic,
      protocol: SubscriptionProtocol.HTTPS,
      endpoint: pagerdutySecret.secretValueFromJson('url').unsafeUnwrap(),
    })

    const multiChecksCanary = (
      id: string,
      canaryName: string,
      schedule: Schedule,
      step: (domain: string) => Record<string, unknown>
    ) => {
      const domainList = [domains.hakijaDomain, domains.hakijaDomainSv, domains.virkailijaDomain]
      const directory = fs.mkdtempSync(path.join(os.tmpdir(), `${canaryName}-`))
      fs.writeFileSync(
        path.join(directory, 'blueprint-config.json'),
        JSON.stringify(
          {
            globalSettings: { stepTimeout: 10000 },
            steps: Object.fromEntries(
              domainList.map((domain, index) => [
                `${index + 1}`,
                { stepName: canaryStepName(domain), ...step(domain) },
              ])
            ),
          },
          null,
          2
        )
      )

      const canary = new Canary(this, id, {
        canaryName,
        runtime: CANARY_RUNTIME,
        schedule,
        test: {
          code: Code.fromAsset(directory),
          handler: 'blueprint.handler',
        },
        startAfterCreation: true,
      })

      const cfnCanary = canary.node.defaultChild as CfnCanary
      cfnCanary.addPropertyOverride('Code.BlueprintTypes', ['multi-checks'])
      cfnCanary.addPropertyDeletionOverride('Code.Handler')

      return canary
    }

    const canary = multiChecksCanary(
      'health-check-canary',
      `va-health-check-${scope.env}`,
      Schedule.rate(HEALTHCHECK_INTERVAL),
      (domain) => ({
        checkerType: 'HTTP',
        url: `https://${domain}${HEALTHCHECK_PATH}`,
        httpMethod: 'GET',
        assertions: [{ type: 'STATUS_CODE', operator: 'EQUALS', value: 200 }],
      })
    )

    const certificateCanary = multiChecksCanary(
      'certificate-check-canary',
      `va-certificate-check-${scope.env}`,
      Schedule.rate(Duration.hours(1)),
      (domain) => ({
        checkerType: 'SSL',
        hostname: domain,
        assertions: [
          {
            type: 'CERTIFICATE_EXPIRY',
            operator: 'GREATER_THAN',
            value: CERTIFICATE_EXPIRY_WARNING_DAYS,
            unit: 'DAYS',
          },
        ],
      })
    )

    const outageAlarm = new Alarm(this, 'site-unreachable-alarm', {
      alarmName: 'valtionavustukset-site-unreachable',
      alarmDescription: [
        'One or more public Valtionavustukset endpoints stopped answering /api/healthcheck with 200.',
        `Suppressed while an ECS deployment is in progress; see ${PUBLISHING_ALARM_NAMES.siteUnreachable}.`,
      ].join(' '),
      metric: canary.metricSuccessPercent({ period: HEALTHCHECK_INTERVAL, statistic: 'Average' }),
      comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
      threshold: 100,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: TreatMissingData.BREACHING,
    })

    const deploymentInProgressAlarm = new Alarm(this, 'deployment-in-progress-alarm', {
      alarmName: 'valtionavustukset-deployment-in-progress',
      alarmDescription:
        'More than one ECS deployment exists, meaning a rollout is under way. Not a fault; used only to suppress outage paging.',
      metric: new Metric({
        namespace: 'ECS/ContainerInsights',
        metricName: 'DeploymentCount',
        dimensionsMap: {
          ClusterName: service.cluster.clusterName,
          ServiceName: service.serviceName,
        },
        statistic: 'Maximum',
        period: Duration.minutes(1),
      }),
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: TreatMissingData.NOT_BREACHING,
    })

    const pagingAlarm = new CompositeAlarm(this, 'site-unreachable-paging-alarm', {
      compositeAlarmName: PUBLISHING_ALARM_NAMES.siteUnreachable,
      alarmRule: AlarmRule.fromAlarm(outageAlarm, AlarmState.ALARM),
      actionsSuppressor: deploymentInProgressAlarm,
      // A deploy takes the site down for ~6 min. The wait period has to outlast the lag
      // before ECS/ContainerInsights publishes DeploymentCount, or the rollout pages anyway.
      actionsSuppressorWaitPeriod: Duration.minutes(5),
      actionsSuppressorExtensionPeriod: Duration.minutes(5),
    })
    pagingAlarm.addAlarmAction(new SnsAction(alarmTopic))

    const certificateAlarm = new Alarm(this, 'certificate-expiring-alarm', {
      alarmName: PUBLISHING_ALARM_NAMES.certificateExpiring,
      alarmDescription: `A public Valtionavustukset certificate expires in under ${CERTIFICATE_EXPIRY_WARNING_DAYS} days, or could not be read at all. ACM renews 60 days out, so renewal has failed and needs fixing by hand.`,
      metric: certificateCanary.metricSuccessPercent({
        period: Duration.hours(1),
        statistic: 'Average',
      }),
      comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
      threshold: 100,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: TreatMissingData.MISSING,
    })
    certificateAlarm.addAlarmAction(new SnsAction(alarmTopic))

    const serviceMetric = (metricName: string) =>
      new Metric({
        namespace: 'AWS/ECS',
        metricName,
        dimensionsMap: {
          ClusterName: service.cluster.clusterName,
          ServiceName: service.serviceName,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      })

    const saturationAlarm = (
      id: string,
      alarmName: string,
      alarmDescription: string,
      metricName: string,
      evaluationPeriods: number
    ) => {
      const alarm = new Alarm(this, id, {
        alarmName,
        alarmDescription,
        metric: serviceMetric(metricName),
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
        threshold: SATURATION_THRESHOLD_PERCENT,
        evaluationPeriods,
        treatMissingData: TreatMissingData.NOT_BREACHING,
      })
      alarm.addAlarmAction(new SnsAction(alarmTopic))
      alarm.addOkAction(new SnsAction(alarmTopic))
    }

    saturationAlarm(
      'cpu-high-alarm',
      PUBLISHING_ALARM_NAMES.cpuHigh,
      'The task has been using nearly all of its 2 vCPU for 15 minutes. It runs alone and cannot scale out, so requests are most likely queueing.',
      'CPUUtilization',
      3
    )

    saturationAlarm(
      'memory-high-alarm',
      PUBLISHING_ALARM_NAMES.memoryHigh,
      'The task is using more memory than its JVM heap can account for, and the next step is an OOM kill and a restart.',
      'MemoryUtilization',
      2
    )

    new Rule(this, 'deployment-failed-rule', {
      ruleName: 'valtionavustukset-deployment-failed',
      description:
        'A rollout failed and the circuit breaker gave up. Never suppressed, because the service is not coming back on its own.',
      eventPattern: {
        source: ['aws.ecs'],
        detailType: ['ECS Deployment State Change'],
        detail: { eventName: ['SERVICE_DEPLOYMENT_FAILED'] },
        resources: [service.serviceArn],
      },
      targets: [new SnsTopic(alarmTopic)],
    })
  }
}
