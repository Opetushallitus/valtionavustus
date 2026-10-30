import * as cdk from 'aws-cdk-lib'
import { Alarm, ComparisonOperator, Metric, TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch'
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions'
import { CfnRule } from 'aws-cdk-lib/aws-events'
import { PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager'
import { CfnSubscription, Topic } from 'aws-cdk-lib/aws-sns'
import { Queue, QueueEncryption } from 'aws-cdk-lib/aws-sqs'
import { Environment } from './va-env-stage'

// The OPH organization's SCP denies every other region. us-east-1 receives global events such as
// exposed access keys; their us-west-2 copies are backups, which the rule drops anyway.
export const AWS_HEALTH_RISK_REGIONS = ['eu-central-1', 'eu-north-1', 'eu-west-1', 'us-east-1']

export class AwsHealthRiskStack extends cdk.Stack {
  constructor(scope: Environment, region: string, enabled: boolean) {
    super(scope, `aws-health-risk-${region}`, { env: { region } })

    const topic = new Topic(this, 'risk', { topicName: 'aws-health-risk' })
    const failures = new Topic(this, 'failures', { topicName: 'aws-health-risk-failures' })
    const queues = Object.fromEntries(
      ['eventbridge', 'sns'].map((name) => [
        name,
        new Queue(this, `${name}-dlq`, {
          queueName: `aws-health-risk-${name}-dlq`,
          retentionPeriod: cdk.Duration.days(14),
          encryption: QueueEncryption.SQS_MANAGED,
        }),
      ])
    )

    const rule = new CfnRule(this, 'rule', {
      name: 'aws-health-risk',
      description: 'All AWS Health RISK events, forwarded to PagerDuty',
      state: enabled ? 'ENABLED' : 'DISABLED',
      eventPattern: {
        source: ['aws.health'],
        detail: {
          service: ['RISK'],
          $or: [{ backupEvent: ['false'] }, { backupEvent: [{ exists: false }] }],
        },
      },
      targets: [
        {
          id: 'health-risk-sns',
          arn: topic.topicArn,
          deadLetterConfig: { arn: queues.eventbridge.queueArn },
          retryPolicy: { maximumEventAgeInSeconds: 86400, maximumRetryAttempts: 185 },
        },
      ],
    })

    topic.addToResourcePolicy(
      new PolicyStatement({
        principals: [new ServicePrincipal('events.amazonaws.com')],
        actions: ['sns:Publish'],
        resources: [topic.topicArn],
        conditions: { ArnEquals: { 'aws:SourceArn': rule.attrArn } },
      })
    )
    for (const [name, queue] of Object.entries(queues)) {
      queue.addToResourcePolicy(
        new PolicyStatement({
          principals: [
            new ServicePrincipal(
              name === 'eventbridge' ? 'events.amazonaws.com' : 'sns.amazonaws.com'
            ),
          ],
          actions: ['sqs:SendMessage'],
          resources: [queue.queueArn],
          conditions: {
            ArnEquals: { 'aws:SourceArn': name === 'eventbridge' ? rule.attrArn : topic.topicArn },
          },
        })
      )
    }
    failures.grantPublish(
      new ServicePrincipal('cloudwatch.amazonaws.com').withConditions({
        StringEquals: { 'aws:SourceAccount': this.account },
      })
    )

    const metrics = [
      ...Object.entries(queues).map(([name, queue]) => ({
        name: `${name}-dlq`,
        metric: queue.metricApproximateNumberOfMessagesVisible({ statistic: 'Maximum' }),
      })),
      ...['FailedInvocations', 'InvocationsFailedToBeSentToDlq'].map((metricName) => ({
        name: `eventbridge-${metricName}`,
        metric: new Metric({
          namespace: 'AWS/Events',
          metricName,
          dimensionsMap: { RuleName: 'aws-health-risk' },
          statistic: 'Sum',
        }),
      })),
      ...['NumberOfNotificationsFailed', 'NumberOfNotificationsFailedToRedriveToDlq'].map(
        (metricName) => ({
          name: `sns-${metricName}`,
          metric: new Metric({
            namespace: 'AWS/SNS',
            metricName,
            dimensionsMap: { TopicName: 'aws-health-risk' },
            statistic: 'Sum',
          }),
        })
      ),
    ]
    for (const { name, metric } of metrics) {
      const alarm = new Alarm(this, `${name}-alarm`, {
        alarmName: `aws-health-risk-${name}`,
        alarmDescription: `AWS Health RISK delivery to PagerDuty failed in ${region}. Failed events are kept in aws-health-risk-*-dlq queues for 14 days.`,
        metric: metric.with({ period: cdk.Duration.minutes(1) }),
        threshold: 0,
        evaluationPeriods: 1,
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: TreatMissingData.NOT_BREACHING,
      })
      alarm.addAlarmAction(new SnsAction(failures))
      alarm.addOkAction(new SnsAction(failures))
    }
  }
}

export function addAwsHealthRiskMonitoring(
  scope: Environment,
  secrets: { pagerdutyHealthSecrets: ISecret; pagerdutyCloudwatchSecrets: ISecret }
) {
  // Resolve secrets only in eu-west-1; SNS supports subscriptions to topics in other regions.
  const subscriptions = new cdk.Stack(scope, 'aws-health-risk-subscriptions')
  const enabled = scope.node.tryGetContext('awsHealthRiskEnabled') === true
  for (const region of AWS_HEALTH_RISK_REGIONS) {
    subscriptions.addStackDependency(new AwsHealthRiskStack(scope, region, enabled))
    const arn = (service: string, resource: string) =>
      subscriptions.formatArn({ service, region, resource })

    new CfnSubscription(subscriptions, `health-${region}`, {
      region,
      topicArn: arn('sns', 'aws-health-risk'),
      protocol: 'https',
      endpoint: secrets.pagerdutyHealthSecrets.secretValueFromJson('url').unsafeUnwrap(),
      rawMessageDelivery: false,
      redrivePolicy: { deadLetterTargetArn: arn('sqs', 'aws-health-risk-sns-dlq') },
      deliveryPolicy: {
        healthyRetryPolicy: {
          minDelayTarget: 1,
          maxDelayTarget: 60,
          numRetries: 50,
          numNoDelayRetries: 3,
          numMinDelayRetries: 2,
          numMaxDelayRetries: 35,
          backoffFunction: 'exponential',
        },
      },
    })
    new CfnSubscription(subscriptions, `failures-${region}`, {
      region,
      topicArn: arn('sns', 'aws-health-risk-failures'),
      protocol: 'https',
      endpoint: secrets.pagerdutyCloudwatchSecrets.secretValueFromJson('url').unsafeUnwrap(),
      rawMessageDelivery: false,
      filterPolicyScope: 'MessageBody',
      filterPolicy: { AlarmName: [{ exists: true }] },
    })
  }
}
