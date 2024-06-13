import * as cdk from 'aws-cdk-lib'
import {
  DedicatedIpPool,
  EmailIdentity,
  Identity,
  ScalingMode,
  SuppressionReasons,
  VdmAttributes,
  ConfigurationSet,
} from 'aws-cdk-lib/aws-ses'
import { Construct } from 'constructs'
import type { IPublicHostedZone } from 'aws-cdk-lib/aws-route53'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { RemovalPolicy } from 'aws-cdk-lib'

interface SmtpStackProps extends cdk.StackProps {
  emailDomainName: string
  emailHostedZone: IPublicHostedZone
}

export class SmtpStack extends cdk.Stack {
  smtpSecrets: Secret

  constructor(scope: Construct, id: string, props: SmtpStackProps) {
    super(scope, id, props)

    const { emailHostedZone, emailDomainName } = props

    const dedicatedIpPool = new DedicatedIpPool(this, 'va-smtp-ip-pool', {
      dedicatedIpPoolName: 'va-smtp-ip-pool',
      scalingMode: ScalingMode.STANDARD,
    })

    const configurationSet = new ConfigurationSet(this, 'va-smtp-configuration-set', {
      configurationSetName: 'valtionavustukset-smtp-configuration-set',
      sendingEnabled: true,
      dedicatedIpPool,
      reputationMetrics: true,
      suppressionReasons: SuppressionReasons.COMPLAINTS_ONLY,
    })

    const mailFromDomain = `mail.${emailDomainName}`

    const identity = new EmailIdentity(this, 'va-smtp-domain-identity', {
      identity: Identity.publicHostedZone(emailHostedZone),
      mailFromDomain,
      configurationSet,
    })

    /*
     * Bounce email address was manually created in Reaktor's Google groups
     * Bounce identity was manually configured via AWS console and clicking email confirmation link
     * TODO: no-reply@jotpa.fi (or similar) email will need to be manually configured via AWS console and getting someone from Jotpa to click confirmation link
     */

    // Virtual Deliverability Manager (VDM)
    new VdmAttributes(this, 'va-smtp-vdm', {
      engagementMetrics: true,
      optimizedSharedDelivery: true,
    })

    /* Manually copied from SES to AWS Secrets via console */
    this.smtpSecrets = new Secret(this, 'va-smtp-credentials', {
      secretName: '/email/credentials',
      description: 'Manually configured SMTP secrets (username, password, etc) for SES',
      removalPolicy: RemovalPolicy.RETAIN,
    })
  }
}
