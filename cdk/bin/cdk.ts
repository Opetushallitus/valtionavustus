#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { VaServiceStack } from '../lib/va-service-stack'
import { OphDnsStack } from '../lib/oph-dns-stack'
import { Environment } from '../lib/va-env-stage'
import { DnsStack } from '../lib/dns-stack'
import { VpcStack } from '../lib/vpc-stack'
import { DbStack } from '../lib/db-stack'
import { BastionStack } from '../lib/bastion-stack'
import { EcsStack } from '../lib/ecs-stack'
import { EncryptionStack } from '../lib/encryption-stack'
import { SecurityGroupStack } from '../lib/security-group-stack'
import { PersistentResourcesStack } from '../lib/persistent-resources-stack'
import { CdnStack } from '../lib/cdn-stack'
import { CertificateStack } from '../lib/certificate-stack'
import { SmtpStack } from '../lib/smtp-stack'

const HAKIJA_DOMAIN = 'valtionavustukset.oph.fi'
const HAKIJA_DOMAIN_SV = 'statsunderstod.oph.fi'
const VIRKAILIJA_DOMAIN = 'virkailija.valtionavustukset.oph.fi'

const app = new cdk.App()
{
  const dev = new Environment(app, 'dev')
  const vpcStack = new VpcStack(dev, 'vpc')
  const securityGroupStack = new SecurityGroupStack(dev, 'security-group', vpcStack.vpc)
  const encryptionStack = new EncryptionStack(dev, 'encryption')
  const ecsStack = new EcsStack(dev, 'ecs', vpcStack.vpc)
  const bastionStack = new BastionStack(
    dev,
    'bastion',
    ecsStack.ecsCluster,
    securityGroupStack.securityGroups.dbAccessSecurityGroup
  )
  const persistentResources = new PersistentResourcesStack(
    dev,
    'persistent-resources',
    encryptionStack.logGroupEncryptionKey
  )
  const dbStack = new DbStack(
    dev,
    'db',
    vpcStack.vpc,
    securityGroupStack.securityGroups.dbSecurityGroup,
    encryptionStack.dbEncryptionKey
  )
  const dns = new DnsStack(dev, 'dns', {
    hakijaDomain: `dev.${HAKIJA_DOMAIN}`,
    hakijaDomainSv: `dev.${HAKIJA_DOMAIN_SV}`,
    virkailijaDomain: `dev.${VIRKAILIJA_DOMAIN}`,
    databaseHostname: dbStack.clusterWriterEndpointHostname,

    delegationRecord: {
      env: 'prod',
      hakijaDomain: HAKIJA_DOMAIN,
      hakijaDomainSv: HAKIJA_DOMAIN_SV,
      virkailijaDomain: VIRKAILIJA_DOMAIN,
    },
  })
  const smtpStack = new SmtpStack(dev, 'smtp', {
    emailDomain: {
      fi: {
        name: `dev.${HAKIJA_DOMAIN}`,
        hostedZone: dns.zones.hakijaZone,
      },
      sv: {
        name: `dev.${HAKIJA_DOMAIN_SV}`,
        hostedZone: dns.zones.hakijaZoneSv,
      },
    },
  })

  const vaService = new VaServiceStack(dev, 'application', {
    vpc: vpcStack.vpc,
    cluster: ecsStack.ecsCluster,
    applicationLogGroup: persistentResources.applicationLogGroup,
    loadBalancerAccessLogBucket: persistentResources.loadBalancerAccessLogBucket,
    databaseHostname: dbStack.clusterWriterEndpointHostname,
    securityGroups: securityGroupStack.securityGroups,
    domains: {
      hakijaDomain: `dev.${HAKIJA_DOMAIN}`,
      virkailijaDomain: `dev.${VIRKAILIJA_DOMAIN}`,
    },
    zones: {
      hakijaZone: dns.zones.hakijaZone,
    },
    secrets: {
      databasePassword: persistentResources.databasePasswordSecret,
      vaultSecrets: persistentResources.ansibleVaultSecrets,
      pagerdutySecrets: persistentResources.pagerdutyApiSecrets,
      smtpSecrets: smtpStack.smtpSecrets,
    },
  })

  const globalCertificatesStack = new CertificateStack(dev, 'certs', {
    domains: dns.domains,
    zones: dns.zones,
    crossRegionReferences: true,
    env: { region: 'us-east-1' }, // Certs used by CDN must be in us-east-1
  })

  const cdn = new CdnStack(dev, 'cdn', {
    domains: dns.domains,
    zones: dns.zones,
    loadBalancerARecord: vaService.loadbalancerARecord,
    sslCertificate: globalCertificatesStack.sslCertificate,
    crossRegionReferences: true, // Cert is in us-east-1
  })
}

{
  const qa = new Environment(app, 'qa')
  const vpcStack = new VpcStack(qa, 'vpc')
  const securityGroupStack = new SecurityGroupStack(qa, 'security-group', vpcStack.vpc)
  const encryptionStack = new EncryptionStack(qa, 'encryption')
  const ecsStack = new EcsStack(qa, 'ecs', vpcStack.vpc)
  const bastionStack = new BastionStack(
    qa,
    'bastion',
    ecsStack.ecsCluster,
    securityGroupStack.securityGroups.dbAccessSecurityGroup
  )
  const persistentResources = new PersistentResourcesStack(
    qa,
    'persistent-resources',
    encryptionStack.logGroupEncryptionKey
  )
  const dbStack = new DbStack(
    qa,
    'db',
    vpcStack.vpc,
    securityGroupStack.securityGroups.dbSecurityGroup,
    encryptionStack.dbEncryptionKey
  )
  const dns = new DnsStack(qa, 'dns', {
    hakijaDomain: `testi.${HAKIJA_DOMAIN}`,
    hakijaDomainSv: `testi.${HAKIJA_DOMAIN_SV}`,
    virkailijaDomain: `testi.${VIRKAILIJA_DOMAIN}`,
    databaseHostname: dbStack.clusterWriterEndpointHostname,

    delegationRecord: {
      env: 'prod',
      hakijaDomain: HAKIJA_DOMAIN,
      hakijaDomainSv: HAKIJA_DOMAIN_SV,
      virkailijaDomain: VIRKAILIJA_DOMAIN,
    },
  })
  const smtpStack = new SmtpStack(qa, 'smtp', {
    emailDomain: {
      fi: {
        name: `testi.${HAKIJA_DOMAIN}`,
        hostedZone: dns.zones.hakijaZone,
      },
      sv: {
        name: `testi.${HAKIJA_DOMAIN_SV}`,
        hostedZone: dns.zones.hakijaZoneSv,
      },
    },
  })

  const vaService = new VaServiceStack(qa, 'application', {
    vpc: vpcStack.vpc,
    cluster: ecsStack.ecsCluster,
    applicationLogGroup: persistentResources.applicationLogGroup,
    loadBalancerAccessLogBucket: persistentResources.loadBalancerAccessLogBucket,
    databaseHostname: dbStack.clusterWriterEndpointHostname,
    securityGroups: securityGroupStack.securityGroups,
    domains: {
      hakijaDomain: `testi.${HAKIJA_DOMAIN}`,
      virkailijaDomain: `testi.${VIRKAILIJA_DOMAIN}`,
    },
    zones: {
      hakijaZone: dns.zones.hakijaZone,
    },
    secrets: {
      databasePassword: persistentResources.databasePasswordSecret,
      vaultSecrets: persistentResources.ansibleVaultSecrets,
      pagerdutySecrets: persistentResources.pagerdutyApiSecrets,
      smtpSecrets: smtpStack.smtpSecrets,
    },
  })

  const globalCertificatesStack = new CertificateStack(qa, 'certs', {
    domains: dns.domains,
    zones: dns.zones,
    crossRegionReferences: true,
    env: { region: 'us-east-1' }, // Certs used by CDN must be in us-east-1
  })

  const cdn = new CdnStack(qa, 'cdn', {
    domains: dns.domains,
    zones: dns.zones,
    loadBalancerARecord: vaService.loadbalancerARecord,
    sslCertificate: globalCertificatesStack.sslCertificate,
    crossRegionReferences: true, // Cert is in us-east-1
  })
}

{
  const prod = new Environment(app, 'prod')
  const vpcStack = new VpcStack(prod, 'vpc')
  const securityGroupStack = new SecurityGroupStack(prod, 'security-group', vpcStack.vpc)
  const encryptionStack = new EncryptionStack(prod, 'encryption')
  const ecsStack = new EcsStack(prod, 'ecs', vpcStack.vpc)
  const bastionStack = new BastionStack(
    prod,
    'bastion',
    ecsStack.ecsCluster,
    securityGroupStack.securityGroups.dbAccessSecurityGroup
  )
  const persistentResources = new PersistentResourcesStack(
    prod,
    'persistent-resources',
    encryptionStack.logGroupEncryptionKey
  )
  const dbStack = new DbStack(
    prod,
    'db',
    vpcStack.vpc,
    securityGroupStack.securityGroups.dbSecurityGroup,
    encryptionStack.dbEncryptionKey
  )
  new OphDnsStack(prod, 'oph-dns')
  const dns = new DnsStack(prod, 'dns', {
    hakijaDomain: HAKIJA_DOMAIN,
    hakijaDomainSv: HAKIJA_DOMAIN_SV,
    virkailijaDomain: VIRKAILIJA_DOMAIN,
    databaseHostname: dbStack.clusterWriterEndpointHostname,
  })
  const smtpStack = new SmtpStack(prod, 'smtp', {
    emailDomain: {
      fi: {
        name: HAKIJA_DOMAIN,
        hostedZone: dns.zones.hakijaZone,
      },
      sv: {
        name: HAKIJA_DOMAIN_SV,
        hostedZone: dns.zones.hakijaZoneSv,
      },
    },
  })

  const vaService = new VaServiceStack(prod, 'application', {
    vpc: vpcStack.vpc,
    cluster: ecsStack.ecsCluster,
    applicationLogGroup: persistentResources.applicationLogGroup,
    loadBalancerAccessLogBucket: persistentResources.loadBalancerAccessLogBucket,
    databaseHostname: dbStack.clusterWriterEndpointHostname,
    securityGroups: securityGroupStack.securityGroups,
    domains: {
      hakijaDomain: HAKIJA_DOMAIN,
      virkailijaDomain: VIRKAILIJA_DOMAIN,
    },
    zones: {
      hakijaZone: dns.zones.hakijaZone,
    },
    secrets: {
      databasePassword: persistentResources.databasePasswordSecret,
      vaultSecrets: persistentResources.ansibleVaultSecrets,
      pagerdutySecrets: persistentResources.pagerdutyApiSecrets,
      smtpSecrets: smtpStack.smtpSecrets,
    },
  })

  const globalCertificatesStack = new CertificateStack(prod, 'certs', {
    domains: dns.domains,
    zones: dns.zones,
    crossRegionReferences: true,
    env: { region: 'us-east-1' }, // Certs used by CDN must be in us-east-1
  })

  const cdn = new CdnStack(prod, 'cdn', {
    domains: dns.domains,
    zones: dns.zones,
    loadBalancerARecord: vaService.loadbalancerARecord,
    sslCertificate: globalCertificatesStack.sslCertificate,
    crossRegionReferences: true, // Cert is in us-east-1
  })
}
