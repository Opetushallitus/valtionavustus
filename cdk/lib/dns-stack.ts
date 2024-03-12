import * as cdk from 'aws-cdk-lib'
import {
  AccountPrincipal,
  CompositePrincipal,
  Effect,
  Policy,
  PolicyStatement,
  Role,
} from 'aws-cdk-lib/aws-iam'
import {
  ARecord,
  CrossAccountZoneDelegationRecord,
  PublicHostedZone,
  RecordTarget,
} from 'aws-cdk-lib/aws-route53'
import { Environment } from './va-env-stage'
import { ValtionavustusEnvironment, getAccountId, getEnv } from './va-context'

interface DnsStackProps extends cdk.StackProps {
  hakijaDomain: string
  hakijaDomainSv: string
  hakijaLegacyARecord?: string

  virkailijaDomain: string
  virkailijaLegacyARecord?: string

  delegationRecord?: {
    env: ValtionavustusEnvironment
    hakijaDomain: string
  }
}

const PROD_DELEGATION_ROLE_NAME = 'DelegateDNSToOtherEnvironment'

export class DnsStack extends cdk.Stack {
  constructor(scope: Environment, id: string, props: DnsStackProps) {
    super(scope, id, props)

    //
    // Hosted zones for hakija and virkailija
    //
    const { hakijaDomain, hakijaDomainSv, virkailijaDomain } = props
    const hakijaZone = new PublicHostedZone(this, 'HakijaZone', {
      zoneName: hakijaDomain,
    })
    hakijaZone.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN)

    const hakijaZoneSv = new PublicHostedZone(this, 'HakijaZoneSv', {
      zoneName: hakijaDomainSv,
    })
    hakijaZoneSv.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN)

    const virkailijaZone = new PublicHostedZone(this, 'VirkailijaZone', {
      zoneName: virkailijaDomain,
    })
    virkailijaZone.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN)

    //
    // A records pointing to old environments
    //
    const { hakijaLegacyARecord, virkailijaLegacyARecord } = props
    if (hakijaLegacyARecord) {
      new ARecord(this, 'HakijaLegacyARecord', {
        zone: hakijaZone,
        target: RecordTarget.fromIpAddresses(hakijaLegacyARecord),
      })
      new ARecord(this, 'HakijaLegacyARecordSv', {
        zone: hakijaZoneSv,
        target: RecordTarget.fromIpAddresses(hakijaLegacyARecord),
      })
    }
    if (virkailijaLegacyARecord) {
      new ARecord(this, 'VirkailijaLegacyARecord', {
        zone: virkailijaZone,
        target: RecordTarget.fromIpAddresses(virkailijaLegacyARecord),
      })
    }

    //
    // Delegation from hakijaZone in prod to other environments and virkailijaZone
    //
    const { delegationRecord } = props
    if (getEnv(this) === 'prod') {
      hakijaZone.addDelegation(virkailijaZone)

      // Create policy that allows making delegation records to this environment's zones
      const allowDelegationPolicy = new Policy(this, 'AllowDNSDelegation')
      hakijaZone.grantDelegation(allowDelegationPolicy)
      hakijaZoneSv.grantDelegation(allowDelegationPolicy)
      virkailijaZone.grantDelegation(allowDelegationPolicy)

      // Since this policy is used from lower environments, explicitly deny
      // adding any records to this environment's domain
      const denyDelegatingRoot = new PolicyStatement({
        effect: Effect.DENY,
        actions: ['route53:ChangeResourceRecordSet'],
        resources: [hakijaZone.hostedZoneArn, virkailijaZone.hostedZoneArn],
        conditions: {
          'ForAnyValue:StringEquals': {
            'route53:ChangeResourceRecordSetsNormalizedRecordNames': [
              hakijaDomain,
              hakijaDomainSv,
              virkailijaDomain,
            ],
          },
        },
      })
      allowDelegationPolicy.addStatements(denyDelegatingRoot)

      // Create role to be used from other environments
      const delegationRole = new Role(this, 'DelegateToEnvironmentRole', {
        roleName: PROD_DELEGATION_ROLE_NAME,
        assumedBy: new CompositePrincipal(
          new AccountPrincipal(getAccountId(this, 'dev')),
          new AccountPrincipal(getAccountId(this, 'qa'))
        ),
      })
      allowDelegationPolicy.attachToRole(delegationRole)
    }

    //
    // Use delegation role to create delegation record in `delegationRecord.env`
    //
    if (delegationRecord) {
      const delegationRoleArn = cdk.Arn.format({
        partition: 'aws',
        region: '',
        account: getAccountId(this, delegationRecord.env),
        service: 'iam',
        resource: 'role',
        resourceName: PROD_DELEGATION_ROLE_NAME,
      })
      const delegationRole = Role.fromRoleArn(
        this,
        'ProdDelegateToEnvironmentRole',
        delegationRoleArn
      )

      new CrossAccountZoneDelegationRecord(this, 'EnvDelegationRecordHakija', {
        delegatedZone: hakijaZone,

        parentHostedZoneName: delegationRecord.hakijaDomain,
        delegationRole: delegationRole,
      })
    }
  }
}
