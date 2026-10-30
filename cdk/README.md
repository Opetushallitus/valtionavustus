# AWS Health RISK → PagerDuty

`lib/aws-health-risk-stack.ts` mirrors `rcs-common/infra/account-security` for the
Valtionavustukset dev, QA and production accounts:

- Collect every `aws.health` event with `detail.service = RISK`, without restricting
  event types, categories or status. Exclude `backupEvent = "true"` copies; accept
  `"false"` or a missing field.
- Forward the unchanged event through SNS to a separate **AWS Health Dashboard**
  vendor integration on the account's existing PagerDuty service. Keep the SNS
  envelope, which the vendor integration needs.
- Retry both delivery hops and retain exhausted deliveries in encrypted SQS DLQs
  for 14 days. Six regional alarms report delivery/redrive failures and nonempty
  DLQs through the existing **CloudWatch** PagerDuty integration.

Collection covers the four regions the OPH organization's SCP allows
(`AWS_HEALTH_RISK_REGIONS`: `eu-central-1`, `eu-north-1`, `eu-west-1`, `us-east-1`),
including `us-east-1`, where global events such as exposed access keys arrive. If the
SCP starts allowing another region, add it to the list.

Subscriptions are managed from `eu-west-1` using CloudFormation's SNS `Region`
property. Both secrets stay in `eu-west-1`; they are not replicated to the
collection regions. All stacks are included in the normal `$ENV/*` deployment.

## Initial rollout

Rules start **disabled** (`awsHealthRiskEnabled: false` in `cdk.json`), so setup
cannot silently lose events before subscription confirmation. For each account:

1. Bootstrap CDK in every collection region with administrator credentials, e.g.
   `./cdk.sh bootstrap aws://ACCOUNT/REGION` from `cdk/`. The updated
   `scripts/bootstrap.sh` bootstraps the complete collection list as well.
2. Deploy `$ENV/persistent-resources` first. This creates the retained
   `/pagerduty/health` secret.
3. Create an **AWS Health Dashboard** integration on the existing environment's
   PagerDuty service (managed in `rcs-common/services/pagerduty/configuration`).
   Store its integration URL in `/pagerduty/health` in `eu-west-1` as
   `{"url":"https://events.eu.pagerduty.com/integration/KEY/enqueue"}` using the
   AWS Console. Do not use the Events v2 API URL or the CloudWatch integration URL.
   Do not commit the URL. Leave `/pagerduty/cloudwatch` unchanged.
4. Deploy `$ENV/*` normally. Confirm both HTTPS subscriptions per collection
   region are confirmed, not `PendingConfirmation`.
5. With an agreed test window, publish an AWS Health-format RISK test event to a
   regional `aws-health-risk` SNS topic and confirm the expected PagerDuty service
   receives it. Publish a CloudWatch-format test alarm to
   `aws-health-risk-failures` and confirm the CloudWatch integration receives it.
   Resolve test incidents. Use EventBridge `test-event-pattern` to check RISK,
   non-RISK, missing `backupEvent`, `"false"` and `"true"` cases without paging.

After all three accounts pass these checks, set `awsHealthRiskEnabled` to **true**
in `cdk.json` and deploy each environment again. Commit the setting so subsequent
CI deployments keep the collectors enabled. To pause collection, set it back to
false and deploy; topics, subscriptions and queued messages remain in place.

## Delivery failures

Check the named region's `aws-health-risk-eventbridge-dlq` and
`aws-health-risk-sns-dlq`, the EventBridge target metrics, SNS delivery metrics and
subscription status. Repair permissions or the endpoint, then replay retained
messages through the appropriate hop. Do not purge queues until successful
PagerDuty delivery is confirmed. Alerts themselves can be lost if the existing
CloudWatch integration is unavailable; this is not an independent paging path.

## Local checks

```sh
cd cdk
npx tsc --noEmit
node --import tsx --test tests/*.test.ts
```

These validate synthesized infrastructure and deployment dependencies, not live
SNS confirmation or PagerDuty incident creation.
