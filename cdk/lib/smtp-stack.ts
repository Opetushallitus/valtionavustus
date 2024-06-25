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
import type { IPublicHostedZone } from 'aws-cdk-lib/aws-route53'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { RemovalPolicy } from 'aws-cdk-lib'
import { Environment } from './va-env-stage'

interface SmtpStackProps extends cdk.StackProps {
  emailDomain: {
    fi: {
      name: string
      hostedZone: IPublicHostedZone
    }
    sv: {
      name: string
      hostedZone: IPublicHostedZone
    }
  }
}

export class SmtpStack extends cdk.Stack {
  smtpSecrets: Secret

  constructor(scope: Environment, id: string, props: SmtpStackProps) {
    super(scope, id, props)

    const dedicatedIpPool = new DedicatedIpPool(this, 'va-smtp-ip-pool', {
      dedicatedIpPoolName: 'va-smtp-ip-pool',
      scalingMode: ScalingMode.STANDARD,
    })

    const configurationSet = new ConfigurationSet(this, 'va-smtp-configuration-set', {
      configurationSetName: 'valtionavustukset-smtp-configuration-set',
      sendingEnabled: scope.env !== 'prod',
      dedicatedIpPool,
      reputationMetrics: true,
      suppressionReasons: SuppressionReasons.COMPLAINTS_ONLY,
    })

    const { emailDomain } = props
    const identityFi = new EmailIdentity(this, 'va-smtp-domain-identity', {
      identity: Identity.publicHostedZone(emailDomain.fi.hostedZone),
      mailFromDomain: `mail.${emailDomain.fi.name}`,
      configurationSet,
    })

    const identitySv = new EmailIdentity(this, 'va-smtp-domain-identity-sv', {
      identity: Identity.publicHostedZone(emailDomain.sv.hostedZone),
      mailFromDomain: `mail.${emailDomain.sv.name}`,
      configurationSet,
    })

    /*
     * Bounce email address was manually created in Reaktor's Google groups
     * Bounce identity was manually configured via AWS console and clicking email confirmation link
     * Jotpa sender identity was manually created using AWS console. Identity was manually verified by Jotpa employee
     * Support case for getting a dedicated IP address for sending mail was done manually using AWS console
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
