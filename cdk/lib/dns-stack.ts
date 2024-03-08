import * as cdk from 'aws-cdk-lib'
import { ARecord, PublicHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { Environment } from './va-env-stage'

interface DnsStackProps extends cdk.StackProps {
  hakijaDomain: string
  virkailijaDomain: string
  hakijaLegacyARecord?: string
  virkailijaLegacyARecord?: string
}

export class DnsStack extends cdk.Stack {
  constructor(scope: Environment, id: string, props: DnsStackProps) {
    super(scope, id, props)

    const { hakijaDomain, virkailijaDomain } = props
    const hakijaZone = new PublicHostedZone(this, 'HakijaZone', {
      zoneName: hakijaDomain,
    })
    const virkailijaZone = new PublicHostedZone(this, 'VirkailijaZone', {
      zoneName: virkailijaDomain,
    })

    const { hakijaLegacyARecord, virkailijaLegacyARecord } = props
    if (hakijaLegacyARecord) {
      new ARecord(this, 'HakijaLegacyARecord', {
        zone: hakijaZone,
        target: RecordTarget.fromIpAddresses(hakijaLegacyARecord),
      })
    }
    if (virkailijaLegacyARecord) {
      new ARecord(this, 'VirkailijaLegacyARecord', {
        zone: virkailijaZone,
        target: RecordTarget.fromIpAddresses(virkailijaLegacyARecord),
      })
    }
  }
}
