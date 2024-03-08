import * as cdk from 'aws-cdk-lib'
import { PublicHostedZone } from 'aws-cdk-lib/aws-route53'
import { Environment } from './va-env-stage'

interface DnsStackProps extends cdk.StackProps {
  hakijaDomain: string
  virkailijaDomain: string
}

export class DnsStack extends cdk.Stack {
  constructor(scope: Environment, id: string, props: DnsStackProps) {
    super(scope, id, props)

    const { hakijaDomain, virkailijaDomain } = props
    const _hakijaZone = new PublicHostedZone(this, 'HakijaZone', {
      zoneName: hakijaDomain,
    })
    const _virkailijaZone = new PublicHostedZone(this, 'VirkailijaZone', {
      zoneName: virkailijaDomain,
    })
  }
}
