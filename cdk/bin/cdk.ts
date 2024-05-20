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

const HAKIJA_DOMAIN = 'valtionavustukset.oph.fi'
const HAKIJA_DOMAIN_SV = 'statsunderstod.oph.fi'
const VIRKAILIJA_DOMAIN = 'virkailija.valtionavustukset.oph.fi'

const LEGACY_LOADBALANCER_IP = '86.50.28.144'

const app = new cdk.App()
{
  const dev = new Environment(app, 'dev')
  const vpcStack = new VpcStack(dev, 'vpc')
  const securityGroupStack = new SecurityGroupStack(dev, 'security-group', vpcStack.vpc)
  const encryptionStack = new EncryptionStack(dev, 'encryption')
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
  const ecsStack = new EcsStack(dev, 'ecs', vpcStack.vpc)
  const vaService = new VaServiceStack(dev, 'application', {
    vpc: vpcStack.vpc,
    cluster: ecsStack.ecsCluster,
    applicationLogGroup: persistentResources.applicationLogGroup,
    db: {
      hostname: dbStack.clusterWriterEndpointHostname,
      passwordSecret: persistentResources.databasePasswordSecret,
    },
    securityGroups: securityGroupStack.securityGroups,
  })
  const bastionStack = new BastionStack(
    dev,
    'bastion',
    ecsStack.ecsCluster,
    securityGroupStack.securityGroups.dbAccessSecurityGroup
  )
  const dns = new DnsStack(dev, 'dns', {
    hakijaDomain: `dev.${HAKIJA_DOMAIN}`,
    hakijaDomainSv: `dev.${HAKIJA_DOMAIN_SV}`,
    hakijaLegacyARecord: LEGACY_LOADBALANCER_IP,
    virkailijaDomain: `dev.${VIRKAILIJA_DOMAIN}`,
    databaseHostname: dbStack.clusterWriterEndpointHostname,

    delegationRecord: {
      env: 'prod',
      hakijaDomain: HAKIJA_DOMAIN,
      hakijaDomainSv: HAKIJA_DOMAIN_SV,
      virkailijaDomain: VIRKAILIJA_DOMAIN,
    },
  })
}

{
  const qa = new Environment(app, 'qa')
  const vpcStack = new VpcStack(qa, 'vpc')
  const securityGroupStack = new SecurityGroupStack(qa, 'security-group', vpcStack.vpc)
  const encryptionStack = new EncryptionStack(qa, 'encryption')
  const dbStack = new DbStack(
    qa,
    'db',
    vpcStack.vpc,
    securityGroupStack.securityGroups.dbSecurityGroup,
    encryptionStack.dbEncryptionKey
  )
  const ecsStack = new EcsStack(qa, 'ecs', vpcStack.vpc)
  const bastionStack = new BastionStack(
    qa,
    'bastion',
    ecsStack.ecsCluster,
    securityGroupStack.securityGroups.dbAccessSecurityGroup
  )
  const dns = new DnsStack(qa, 'dns', {
    hakijaDomain: `testi.${HAKIJA_DOMAIN}`,
    hakijaDomainSv: `testi.${HAKIJA_DOMAIN_SV}`,
    hakijaLegacyARecord: LEGACY_LOADBALANCER_IP,
    virkailijaDomain: `testi.${VIRKAILIJA_DOMAIN}`,
    virkailijaLegacyARecord: LEGACY_LOADBALANCER_IP,
    databaseHostname: dbStack.clusterWriterEndpointHostname,

    delegationRecord: {
      env: 'prod',
      hakijaDomain: HAKIJA_DOMAIN,
      hakijaDomainSv: HAKIJA_DOMAIN_SV,
      virkailijaDomain: VIRKAILIJA_DOMAIN,
    },
  })
}

{
  const prod = new Environment(app, 'prod')
  const vpcStack = new VpcStack(prod, 'vpc')
  const securityGroupStack = new SecurityGroupStack(prod, 'security-group', vpcStack.vpc)
  const encryptionStack = new EncryptionStack(prod, 'encryption')
  const dbStack = new DbStack(
    prod,
    'db',
    vpcStack.vpc,
    securityGroupStack.securityGroups.dbSecurityGroup,
    encryptionStack.dbEncryptionKey
  )
  const ecsStack = new EcsStack(prod, 'ecs', vpcStack.vpc)
  const bastionStack = new BastionStack(
    prod,
    'bastion',
    ecsStack.ecsCluster,
    securityGroupStack.securityGroups.dbAccessSecurityGroup
  )
  new OphDnsStack(prod, 'oph-dns')
  const dns = new DnsStack(prod, 'dns', {
    hakijaDomain: HAKIJA_DOMAIN,
    hakijaDomainSv: HAKIJA_DOMAIN_SV,
    hakijaLegacyARecord: LEGACY_LOADBALANCER_IP,
    virkailijaDomain: VIRKAILIJA_DOMAIN,
    virkailijaLegacyARecord: LEGACY_LOADBALANCER_IP,
    databaseHostname: dbStack.clusterWriterEndpointHostname,
  })
}
