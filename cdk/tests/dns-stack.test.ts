import { describe, it, test } from 'node:test'
import * as cdk from 'aws-cdk-lib'
import { Match, Matcher, Template } from 'aws-cdk-lib/assertions'
import { DnsStack } from '../lib/dns-stack'
import { ValtionavustusEnvironment } from '../lib/va-context'
import { Environment } from '../lib/va-env-stage'

const DEV_ACCOUNT = '12345'
const QA_ACCOUNT = '54321'
const PROD_ACCOUNT = '67890'

function createEnvStage(env: ValtionavustusEnvironment): Environment {
  const app = new cdk.App()
  process.env = {
    AWS_ACCOUNT_ID_DEV: DEV_ACCOUNT,
    AWS_ACCOUNT_ID_QA: QA_ACCOUNT,
    AWS_ACCOUNT_ID_PROD: PROD_ACCOUNT,
    REVISION: 'test',
  }
  return new Environment(app, env)
}

describe('hosted zones', () => {
  const env = createEnvStage('dev')
  const template = Template.fromStack(
    new DnsStack(env, 'dns', {
      hakijaDomain: 'dev.valtionavustukset.oph.fi',
      hakijaDomainSv: 'dev.statsunderstod.oph.fi',
      virkailijaDomain: 'dev.virkailija.valtionavustukset.oph.fi',
      databaseHostname: 'va-aurora-cluster.cluster-9asdfkjewoidfn.eu-west-1.rds.amazonaws.com',
    })
  )

  describe('should have hosted zone for', () => {
    test('hakija', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'dev.valtionavustukset.oph.fi.',
      })
    })
    test('hakija Swedish', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'dev.statsunderstod.oph.fi.',
      })
    })
    test('virkailija', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'dev.virkailija.valtionavustukset.oph.fi.',
      })
    })
  })

  it('should have deletion policy', () => {
    template.allResources('AWS::Route53::HostedZone', {
      DeletionPolicy: 'Retain',
      UpdateReplacePolicy: 'Retain',
    })
  })

  it('should not have any records by default', () => {
    template.resourceCountIs('AWS::Route53::RecordSet', 0)
  })
})

describe('legacy A records', () => {
  it('should have A record for hakija domains', () => {
    const env = createEnvStage('dev')
    const template = Template.fromStack(
      new DnsStack(env, 'dns', {
        hakijaDomain: 'dev.valtionavustukset.oph.fi',
        hakijaDomainSv: 'dev.statsunderstod.oph.fi',
        virkailijaDomain: 'dev.virkailija.valtionavustukset.oph.fi',
        hakijaLegacyARecord: '123.123.123.123',
        databaseHostname: 'va-aurora-cluster.cluster-9asdfkjewoidfn.eu-west-1.rds.amazonaws.com',
      })
    )

    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'dev.valtionavustukset.oph.fi.',
      Type: 'A',
      ResourceRecords: ['123.123.123.123'],
    })
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'dev.statsunderstod.oph.fi.',
      Type: 'A',
      ResourceRecords: ['123.123.123.123'],
    })

    template.resourceCountIs('AWS::Route53::RecordSet', 2)
  })

  it('should have A record for virkailija domain', () => {
    const env = createEnvStage('dev')
    const template = Template.fromStack(
      new DnsStack(env, 'dns', {
        hakijaDomain: 'dev.valtionavustukset.oph.fi',
        hakijaDomainSv: 'dev.statsunderstod.oph.fi',
        virkailijaDomain: 'dev.virkailija.valtionavustukset.oph.fi',
        virkailijaLegacyARecord: '123.123.123.123',
        databaseHostname: 'va-aurora-cluster.cluster-9asdfkjewoidfn.eu-west-1.rds.amazonaws.com',
      })
    )

    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'dev.virkailija.valtionavustukset.oph.fi.',
      Type: 'A',
      ResourceRecords: ['123.123.123.123'],
    })

    template.resourceCountIs('AWS::Route53::RecordSet', 1)
  })

  it('should have A record for both domains', () => {
    const env = createEnvStage('dev')
    const template = Template.fromStack(
      new DnsStack(env, 'dns', {
        hakijaDomain: 'dev.valtionavustukset.oph.fi',
        hakijaDomainSv: 'dev.statsunderstod.oph.fi',
        hakijaLegacyARecord: '123.0.0.123',
        virkailijaDomain: 'dev.virkailija.valtionavustukset.oph.fi',
        virkailijaLegacyARecord: '123.123.123.123',
        databaseHostname: 'va-aurora-cluster.cluster-9asdfkjewoidfn.eu-west-1.rds.amazonaws.com',
      })
    )

    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'dev.virkailija.valtionavustukset.oph.fi.',
      Type: 'A',
      ResourceRecords: ['123.123.123.123'],
    })
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'dev.valtionavustukset.oph.fi.',
      Type: 'A',
      ResourceRecords: ['123.0.0.123'],
    })
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'dev.statsunderstod.oph.fi.',
      Type: 'A',
      ResourceRecords: ['123.0.0.123'],
    })

    template.resourceCountIs('AWS::Route53::RecordSet', 3)
  })
})

describe('Delegation', () => {
  describe('in dev', () => {
    const env = createEnvStage('dev')
    const template = Template.fromStack(
      new DnsStack(env, 'dns', {
        hakijaDomain: 'dev.valtionavustukset.oph.fi',
        hakijaDomainSv: 'dev.statsunderstod.oph.fi',
        virkailijaDomain: 'dev.virkailija.valtionavustukset.oph.fi',
        databaseHostname: 'va-aurora-cluster.cluster-9asdfkjewoidfn.eu-west-1.rds.amazonaws.com',
        delegationRecord: {
          env: 'prod',
          hakijaDomain: 'valtionavustukset.oph.fi',
          hakijaDomainSv: 'statsunderstod.oph.fi',
          virkailijaDomain: 'virkailija.valtionavustukset.oph.fi',
        },
      })
    )

    it('should not have any delegation records', () => {
      template.resourcePropertiesCountIs('AWS::Route53::RecordSet', { Type: 'NS' }, 0)
    })
  })

  describe('in prod', () => {
    const env = createEnvStage('prod')
    const template = Template.fromStack(
      new DnsStack(env, 'dns', {
        hakijaDomain: 'va.oph.fi',
        hakijaDomainSv: 'va.oph.fi',
        virkailijaDomain: 'virkailija.va.oph.fi',
        databaseHostname: 'va-aurora-cluster.cluster-9asdfkjewoidfn.eu-west-1.rds.amazonaws.com',
      })
    )

    it('should have delegation record for virkailija domain', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: 'virkailija.va.oph.fi.',
        Type: 'NS',
      })
    })

    it('should have delegation role for dev and qa', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'DelegateDNSToOtherEnvironment',
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: [allowAccountPrincipal(DEV_ACCOUNT), allowAccountPrincipal(QA_ACCOUNT)],
        }),
      })
    })
  })
})

function arn(...rest: any) {
  const partition = Match.anyValue()
  return {
    'Fn::Join': ['', ['arn:', partition, ...rest]],
  }
}

function allowAccountPrincipal(accountId: string): Matcher {
  return Match.objectEquals({
    Action: 'sts:AssumeRole',
    Effect: 'Allow',
    Principal: {
      AWS: arn(`:iam::${accountId}:root`),
    },
  })
}
