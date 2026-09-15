import * as assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import * as cdk from 'aws-cdk-lib'
import { Match, Template } from 'aws-cdk-lib/assertions'
import { Cluster, FargateService } from 'aws-cdk-lib/aws-ecs'
import { Vpc } from 'aws-cdk-lib/aws-ec2'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { MonitoringStack, canaryStepName } from '../lib/monitoring-stack'
import { Environment } from '../lib/va-env-stage'

function createTemplate(): Template {
  const app = new cdk.App()
  process.env = {
    AWS_ACCOUNT_ID_DEV: '12345',
    AWS_ACCOUNT_ID_QA: '54321',
    AWS_ACCOUNT_ID_PROD: '67890',
    REVISION: 'test',
  }
  const stage = new Environment(app, 'prod')
  const dependencies = new cdk.Stack(stage, 'dependencies')
  const cluster = Cluster.fromClusterAttributes(dependencies, 'cluster', {
    clusterName: 'valtionavustukset-cluster',
    vpc: new Vpc(dependencies, 'vpc'),
  })
  const service = FargateService.fromFargateServiceAttributes(dependencies, 'service', {
    cluster,
    serviceName: 'valtionavustukset',
  })

  return Template.fromStack(
    new MonitoringStack(stage, 'monitoring', {
      domains: {
        hakijaDomain: 'valtionavustukset.oph.fi',
        hakijaDomainSv: 'statsunderstod.oph.fi',
        virkailijaDomain: 'virkailija.valtionavustukset.oph.fi',
      },
      service,
      pagerdutySecret: new Secret(dependencies, 'pagerduty', {
        secretName: '/pagerduty/cloudwatch',
      }),
    })
  )
}

describe('health check canary', () => {
  const template = createTemplate()

  test('uses the multi checks blueprint instead of a handler', () => {
    template.hasResourceProperties('AWS::Synthetics::Canary', {
      Code: Match.objectLike({
        BlueprintTypes: ['multi-checks'],
        Handler: Match.absent(),
      }),
      RuntimeVersion: 'syn-nodejs-5.2',
      Name: 'va-health-check-prod',
      Schedule: Match.objectLike({ Expression: 'rate(5 minutes)' }),
    })
  })
})

describe('blueprint step names', () => {
  test('match the schema pattern the canary runtime enforces', () => {
    for (const domain of ['valtionavustukset.oph.fi', 'statsunderstod.oph.fi']) {
      assert.match(canaryStepName(domain), /^[a-zA-Z][a-zA-Z0-9_-]*$/)
    }
  })
})

describe('outage alarm', () => {
  const template = createTemplate()

  test('needs two consecutive failed runs before alarming', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'valtionavustukset-site-unreachable',
      Namespace: 'CloudWatchSynthetics',
      MetricName: 'SuccessPercent',
      ComparisonOperator: 'LessThanThreshold',
      Threshold: 100,
      Period: 300,
      EvaluationPeriods: 2,
      DatapointsToAlarm: 2,
      TreatMissingData: 'breaching',
    })
  })

  test('treats a missing deployment metric as no deployment', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'valtionavustukset-deployment-in-progress',
      Namespace: 'ECS/ContainerInsights',
      MetricName: 'DeploymentCount',
      ComparisonOperator: 'GreaterThanThreshold',
      Threshold: 1,
      TreatMissingData: 'notBreaching',
    })
  })

  test('is suppressed while a deployment is in progress', () => {
    template.hasResourceProperties('AWS::CloudWatch::CompositeAlarm', {
      AlarmName: 'valtionavustukset-site-unreachable-paging',
      ActionsSuppressor: Match.anyValue(),
      ActionsSuppressorWaitPeriod: 300,
      ActionsSuppressorExtensionPeriod: 60,
      AlarmActions: Match.anyValue(),
    })
  })

  test('neither canary alarm pages directly, so a deploy cannot slip past the suppressor', () => {
    for (const alarmName of [
      'valtionavustukset-site-unreachable',
      'valtionavustukset-deployment-in-progress',
    ]) {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: alarmName,
        AlarmActions: Match.absent(),
      })
    }
  })
})

describe('certificate check', () => {
  const template = createTemplate()

  test('runs hourly in its own canary, away from the outage signal', () => {
    template.hasResourceProperties('AWS::Synthetics::Canary', {
      Name: 'va-certificate-check-prod',
      Schedule: Match.objectLike({ Expression: 'rate(60 minutes)' }),
      Code: Match.objectLike({ BlueprintTypes: ['multi-checks'] }),
    })
  })

  test('pages on its own, without deploy suppression', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'valtionavustukset-certificate-expiring',
      Namespace: 'CloudWatchSynthetics',
      MetricName: 'SuccessPercent',
      ComparisonOperator: 'LessThanThreshold',
      Threshold: 100,
      AlarmActions: Match.anyValue(),
    })
  })
})

describe('failed deployment', () => {
  const template = createTemplate()

  test('pages without any suppression', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      EventPattern: {
        source: ['aws.ecs'],
        'detail-type': ['ECS Deployment State Change'],
        detail: { eventName: ['SERVICE_DEPLOYMENT_FAILED'] },
        resources: Match.anyValue(),
      },
    })
  })
})

describe('saturation alarms', () => {
  const template = createTemplate()

  test('page on sustained cpu use, and resolve when it recovers', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'valtionavustukset-cpu-high',
      Namespace: 'AWS/ECS',
      MetricName: 'CPUUtilization',
      Statistic: 'Average',
      Threshold: 85,
      EvaluationPeriods: 3,
      TreatMissingData: 'notBreaching',
      AlarmActions: Match.anyValue(),
      OKActions: Match.anyValue(),
    })
  })

  test('page on sustained memory use, and resolve when it recovers', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'valtionavustukset-memory-high',
      Namespace: 'AWS/ECS',
      MetricName: 'MemoryUtilization',
      Statistic: 'Average',
      Threshold: 85,
      EvaluationPeriods: 2,
      TreatMissingData: 'notBreaching',
      AlarmActions: Match.anyValue(),
      OKActions: Match.anyValue(),
    })
  })
})

describe('pagerduty subscription', () => {
  test('reads the integration url from Secrets Manager', () => {
    const template = createTemplate()
    template.hasResourceProperties('AWS::SNS::Subscription', {
      Protocol: 'https',
      Endpoint: {
        'Fn::Join': ['', Match.arrayWith([':SecretString:url::}}'])],
      },
    })
  })
})
