import * as cdk from 'aws-cdk-lib'
import { Environment } from './va-env-stage'
import { Peer, Port, SecurityGroup, IVpc } from 'aws-cdk-lib/aws-ec2'
import { HAKIJA_PORT, VIRKAILIJA_PORT } from './va-service-stack'

export interface VaSecurityGroups {
  vaServiceSecurityGroup: SecurityGroup
  dbSecurityGroup: SecurityGroup
  albSecurityGroup: SecurityGroup
  dbAccessSecurityGroup: SecurityGroup
}

export class SecurityGroupStack extends cdk.Stack {
  securityGroups: VaSecurityGroups = {} as VaSecurityGroups

  constructor(scope: Environment, id: string, vpc: IVpc, props?: cdk.StackProps) {
    super(scope, id, props)

    /* ---------- DB ----------  */
    this.securityGroups.dbAccessSecurityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      'AccessVADBSecurityGroup',
      {
        vpc,
        securityGroupName: 'allow-db-access',
        description: 'Security group for accessing VA Postgres',
        allowAllOutbound: true,
      }
    )

    this.securityGroups.dbSecurityGroup = new cdk.aws_ec2.SecurityGroup(this, 'DBSecurityGroup', {
      vpc,
      securityGroupName: 'va-database',
      description: 'Security group for VA Postgres',
      allowAllOutbound: true,
    })

    this.securityGroups.dbSecurityGroup.addIngressRule(
      this.securityGroups.dbAccessSecurityGroup,
      cdk.aws_ec2.Port.tcp(5432),
      'Allow access from VA DB security group'
    )

    /* ---------- VA Service ----------  */
    this.securityGroups.vaServiceSecurityGroup = new SecurityGroup(this, 'va-app-sg', {
      vpc: vpc,
      securityGroupName: 'valtionavustukset-application',
      description: 'Valtionavustukset application security group',
      allowAllOutbound: true,
    })

    this.securityGroups.albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      vpc,
      securityGroupName: 'application-load-balancer',
      description: 'Allow HTTP from public Internet',
      allowAllOutbound: true,
    })

    this.securityGroups.albSecurityGroup.addIngressRule(
      Peer.ipv4('62.165.154.10/32'),
      Port.tcp(80),
      'Allow access from Reaktor office'
    )
    this.securityGroups.albSecurityGroup.addEgressRule(
      this.securityGroups.vaServiceSecurityGroup,
      Port.tcp(VIRKAILIJA_PORT),
      'Allow egress to VA virkailija service'
    )
    this.securityGroups.vaServiceSecurityGroup.addIngressRule(
      this.securityGroups.albSecurityGroup,
      Port.tcp(VIRKAILIJA_PORT),
      'Allow access to virkailija from ALB'
    )

    this.securityGroups.albSecurityGroup.addEgressRule(
      this.securityGroups.vaServiceSecurityGroup,
      Port.tcp(HAKIJA_PORT),
      'Allow egress to VA hakija service'
    )
    this.securityGroups.vaServiceSecurityGroup.addIngressRule(
      this.securityGroups.albSecurityGroup,
      Port.tcp(HAKIJA_PORT),
      'Allow access to hakija from ALB'
    )
  }
}
