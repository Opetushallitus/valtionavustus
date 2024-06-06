import * as cdk from 'aws-cdk-lib'
import * as path from 'node:path'
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  OriginAccessIdentity,
  OriginProtocolPolicy,
  OriginRequestPolicy,
  SSLMethod,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { BucketDeployment, CacheControl, Source } from 'aws-cdk-lib/aws-s3-deployment'
import { Environment } from './va-env-stage'
import { getEnv } from './va-context'
import { ARecord, PublicHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { AWS_SERVICE_PREFIX } from '../bin/cdk'
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets'
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager'

export interface Domains {
  hakijaDomain: string
  hakijaDomainSv: string
  virkailijaDomain: string
}

export interface HostedZones {
  hakijaZone: PublicHostedZone
  hakijaZoneSv: PublicHostedZone
  virkailijaZone: PublicHostedZone
}

interface CdnStackProps extends cdk.StackProps {
  loadBalancer: ApplicationLoadBalancer
  domains: Domains
  zones: HostedZones
  sslCertificate: Certificate
}

export class CdnStack extends cdk.Stack {
  cdnDistribution: Distribution

  constructor(scope: Environment, id: string, props: CdnStackProps) {
    super(scope, id, props)

    const { domains, zones, loadBalancer, sslCertificate } = props
    const { hakijaDomain, hakijaDomainSv, virkailijaDomain } = domains
    const { hakijaZone, hakijaZoneSv, virkailijaZone } = zones

    /* ---------- Maintenance page content --------------- */
    const bucketName = `oph-va-static-pages-${scope.env}`
    const staticPagesBucket = new Bucket(this, 'va-static-page-bucket', {
      bucketName: bucketName,
    })

    new BucketDeployment(this, 'va-static-page-bucket-deployment', {
      destinationBucket: staticPagesBucket,
      sources: [Source.asset(path.join(__dirname, 'assets/maintenance-page'))],
      cacheControl: [CacheControl.noCache()],
      destinationKeyPrefix: 'maintenance-page/', // This must match with CDN "path pattern"
    })

    const oai = new OriginAccessIdentity(this, 'cdn-origin-access-identity')
    staticPagesBucket.grantRead(oai)

    /* ---------- CDN --------------- */
    this.cdnDistribution = new Distribution(this, 'va-cdn-distribution', {
      domainNames: [
        `${AWS_SERVICE_PREFIX}${hakijaDomain}`,
        `${AWS_SERVICE_PREFIX}${hakijaDomainSv}`,
        `${AWS_SERVICE_PREFIX}${virkailijaDomain}`,
      ],
      certificate: sslCertificate,
      sslSupportMethod: SSLMethod.SNI,
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(loadBalancer, {
          protocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
        }),
        allowedMethods: AllowedMethods.ALLOW_ALL,
        originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
        cachePolicy: CachePolicy.CACHING_DISABLED,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      errorResponses: [
        { httpStatus: 500, responsePagePath: '/maintenance-page/index.html' },
        { httpStatus: 502, responsePagePath: '/maintenance-page/index.html' },
        { httpStatus: 503, responsePagePath: '/maintenance-page/index.html' },
        { httpStatus: 504, responsePagePath: '/maintenance-page/index.html' },
      ],
      additionalBehaviors: {
        '/maintenance-page/*': {
          origin: new origins.S3Origin(staticPagesBucket, {
            originAccessIdentity: oai,
          }),
          allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: CachePolicy.CACHING_DISABLED,
        },
      },
      enableIpv6: false,
    })

    /* ---------- CDN DNS Records --------------- */
    if (getEnv(this) === 'dev') {
      new ARecord(this, 'cdn-hakija-fi-a-alias-record', {
        zone: hakijaZone,
        recordName: `${AWS_SERVICE_PREFIX}${hakijaDomain}.`,
        target: RecordTarget.fromAlias(new CloudFrontTarget(this.cdnDistribution)),
        comment: 'CDN A record "alias" for hakija FI',
      })
      new ARecord(this, 'cdn-hakija-sv-a-alias-record', {
        zone: hakijaZoneSv,
        recordName: `${AWS_SERVICE_PREFIX}${hakijaDomainSv}.`,
        target: RecordTarget.fromAlias(new CloudFrontTarget(this.cdnDistribution)),
        comment: 'CDN A record "alias" for hakija SV',
      })
      new ARecord(this, 'cdn-virkailija-a-alias-record', {
        zone: virkailijaZone,
        recordName: `${AWS_SERVICE_PREFIX}${virkailijaDomain}.`,
        target: RecordTarget.fromAlias(new CloudFrontTarget(this.cdnDistribution)),
        comment: 'CDN A record "alias" for virkailija',
      })
    }
  }
}
