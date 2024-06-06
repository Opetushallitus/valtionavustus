import * as cdk from 'aws-cdk-lib'
import { Environment } from './va-env-stage'
import { Domains, HostedZones } from './cdn-stack'
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager'

interface CertificateStackProps extends cdk.StackProps {
  domains: Domains
  zones: HostedZones
}

export class CertificateStack extends cdk.Stack {
  sslCertificate: Certificate

  constructor(scope: Environment, id: string, props: CertificateStackProps) {
    super(scope, id, props)

    /* ---------- SSL certificate --------------- */
    const { domains, zones } = props
    const { hakijaDomain, hakijaDomainSv, virkailijaDomain } = domains
    const { hakijaZone, hakijaZoneSv, virkailijaZone } = zones

    this.sslCertificate = new Certificate(this, 'ssl-certificate-for-cdn', {
      domainName: hakijaDomain,
      subjectAlternativeNames: [
        hakijaDomainSv,
        virkailijaDomain,
        `*.${hakijaDomain}`,
        `*.${hakijaDomainSv}`,
        `*.${virkailijaDomain}`,
      ],
      validation: CertificateValidation.fromDnsMultiZone({
        [hakijaDomain]: hakijaZone,
        [hakijaDomainSv]: hakijaZoneSv,
        [virkailijaDomain]: virkailijaZone,
      }),
    })
  }
}
