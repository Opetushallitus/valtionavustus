import * as assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import * as cdk from 'aws-cdk-lib'
import { Match, Template } from 'aws-cdk-lib/assertions'
import { Key } from 'aws-cdk-lib/aws-kms'
import { PersistentResourcesStack } from '../lib/persistent-resources-stack'
import {
  addAwsHealthRiskMonitoring,
  AWS_HEALTH_RISK_REGIONS,
  AwsHealthRiskStack,
} from '../lib/aws-health-risk-stack'
import { Environment } from '../lib/va-env-stage'

Object.assign(process.env, {
  AWS_ACCOUNT_ID_DEV: '111111111111',
  AWS_ACCOUNT_ID_QA: '222222222222',
  AWS_ACCOUNT_ID_PROD: '333333333333',
  REVISION: 'test',
})

function createCollector(enabled = false) {
  const app = new cdk.App()
  const stage = new Environment(app, 'prod')
  return Template.fromStack(new AwsHealthRiskStack(stage, 'us-east-1', enabled))
}

describe('AWS Health RISK collector', () => {
  const template = createCollector()

  test('starts disabled and accepts all RISK events except backup copies', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      Name: 'aws-health-risk',
      State: 'DISABLED',
      EventPattern: {
        source: ['aws.health'],
        detail: {
          service: ['RISK'],
          $or: [{ backupEvent: ['false'] }, { backupEvent: [{ exists: false }] }],
        },
      },
      Targets: [
        {
          Id: 'health-risk-sns',
          Arn: Match.anyValue(),
          DeadLetterConfig: { Arn: Match.anyValue() },
          RetryPolicy: { MaximumEventAgeInSeconds: 86400, MaximumRetryAttempts: 185 },
          Input: Match.absent(),
          InputTransformer: Match.absent(),
        },
      ],
    })
    createCollector(true).hasResourceProperties('AWS::Events::Rule', { State: 'ENABLED' })
  })

  test('retains failed deliveries at both hops for 14 days with managed encryption', () => {
    template.resourceCountIs('AWS::SQS::Queue', 2)
    for (const hop of ['eventbridge', 'sns']) {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `aws-health-risk-${hop}-dlq`,
        MessageRetentionPeriod: 1209600,
        SqsManagedSseEnabled: true,
      })
    }
  })

  test('restricts EventBridge publishing and both DLQs to their source', () => {
    const [ruleId] = Object.keys(template.findResources('AWS::Events::Rule'))
    const [topicId] = Object.keys(
      template.findResources('AWS::SNS::Topic', { Properties: { TopicName: 'aws-health-risk' } })
    )
    template.hasResourceProperties('AWS::SNS::TopicPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 'sns:Publish',
            Principal: { Service: 'events.amazonaws.com' },
            Resource: { Ref: topicId },
            Condition: { ArnEquals: { 'aws:SourceArn': { 'Fn::GetAtt': [ruleId, 'Arn'] } } },
          }),
        ]),
      },
    })
    for (const [service, source] of [
      ['events.amazonaws.com', { 'Fn::GetAtt': [ruleId, 'Arn'] }],
      ['sns.amazonaws.com', { Ref: topicId }],
    ]) {
      template.hasResourceProperties('AWS::SQS::QueuePolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sqs:SendMessage',
              Principal: { Service: service },
              Condition: { ArnEquals: { 'aws:SourceArn': source } },
            }),
          ]),
        },
      })
    }
  })

  test('alarms and resolves on failed delivery, failed redrive, or queued events', () => {
    template.resourceCountIs('AWS::CloudWatch::Alarm', 6)
    for (const metric of [
      'ApproximateNumberOfMessagesVisible',
      'FailedInvocations',
      'InvocationsFailedToBeSentToDlq',
      'NumberOfNotificationsFailed',
      'NumberOfNotificationsFailedToRedriveToDlq',
    ]) {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: metric,
        Period: 60,
        Threshold: 0,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 1,
        TreatMissingData: 'notBreaching',
        AlarmActions: Match.anyValue(),
        OKActions: Match.anyValue(),
      })
    }
  })
})

for (const env of ['dev', 'qa', 'prod'] as const) {
  test(`${env} collects in every configured region and uses separate Health and CloudWatch endpoints`, () => {
    const app = new cdk.App({ context: { awsHealthRiskEnabled: true } })
    const stage = new Environment(app, env)
    const dependencies = new cdk.Stack(stage, 'dependencies')
    const persistentResources = new PersistentResourcesStack(
      stage,
      'persistent-resources',
      new Key(dependencies, 'storage')
    )
    addAwsHealthRiskMonitoring(stage, persistentResources)
    Template.fromStack(persistentResources).hasResource('AWS::SecretsManager::Secret', {
      Properties: { Name: '/pagerduty/health' },
      DeletionPolicy: 'Retain',
      UpdateReplacePolicy: 'Retain',
    })
    const subscriptions = stage.node.findChild('aws-health-risk-subscriptions') as cdk.Stack
    const template = Template.fromStack(subscriptions)
    template.resourceCountIs('AWS::SNS::Subscription', AWS_HEALTH_RISK_REGIONS.length * 2)
    assert.ok(AWS_HEALTH_RISK_REGIONS.includes('us-east-1'))
    for (const region of AWS_HEALTH_RISK_REGIONS) {
      const collector = stage.node.findChild(`aws-health-risk-${region}`) as cdk.Stack
      assert.equal(collector.region, region)
      assert.ok(subscriptions.dependencies.includes(collector))
      Template.fromStack(collector).hasResourceProperties('AWS::Events::Rule', { State: 'ENABLED' })
      const resources = template.findResources('AWS::SNS::Subscription')
      const health = resources[`health${region.replace(/-/g, '')}`].Properties
      const failures = resources[`failures${region.replace(/-/g, '')}`].Properties
      assert.equal(health.Region, region)
      assert.equal(failures.Region, region)
      assert.equal(health.RawMessageDelivery, false)
      assert.notDeepEqual(health.Endpoint, failures.Endpoint)
      assert.match(JSON.stringify(health.Endpoint), /health/)
      assert.match(JSON.stringify(failures.Endpoint), /cloudwatch/)
      assert.equal(health.DeliveryPolicy.healthyRetryPolicy.numRetries, 50)
      assert.match(JSON.stringify(health.RedrivePolicy), /aws-health-risk-sns-dlq/)
      assert.match(JSON.stringify(health.TopicArn), /aws-health-risk/)
      assert.match(JSON.stringify(failures.TopicArn), /aws-health-risk-failures/)
      assert.deepEqual(failures.FilterPolicy, { AlarmName: [{ exists: true }] })
      assert.equal(failures.FilterPolicyScope, 'MessageBody')
    }
    // Also validate that the cross-stack deployment graph has no cycles.
    app.synth()
  })
}
