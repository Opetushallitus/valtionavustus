import * as cdk from 'aws-cdk-lib'
import { RemovalPolicy } from 'aws-cdk-lib'
import { Environment } from './va-env-stage'
import { CfnEIP, NatProvider, SubnetType } from 'aws-cdk-lib/aws-ec2'

export class VpcStack extends cdk.Stack {
  public vpc: cdk.aws_ec2.Vpc
  natGwElasticIPAddresses: CfnEIP[]

  constructor(scope: Environment, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const createElasticIP = (id: string, name: string) => {
      const eip = new CfnEIP(this, id, {
        tags: [{ key: 'Name', value: name }],
      })
      eip.applyRemovalPolicy(RemovalPolicy.RETAIN)
      return eip
    }

    this.natGwElasticIPAddresses = [
      createElasticIP('nat-gw-elastic-ip-1', 'NAT-GW-Elastic-IP-1'),
      createElasticIP('nat-gw-elastic-ip-2', 'NAT-GW-Elastic-IP-2'),
      createElasticIP('nat-gw-elastic-ip-3', 'NAT-GW-Elastic-IP-3'),
    ]

    const natGatewayEipAllocationIds = this.natGwElasticIPAddresses.map((ip) => ip.attrAllocationId)
    const natGateway = NatProvider.gateway({ eipAllocationIds: natGatewayEipAllocationIds })

    const vpc = new cdk.aws_ec2.Vpc(this, 'VPC', {
      subnetConfiguration: [
        {
          name: 'valtionavustukset-isolated-subnet',
          subnetType: SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
        {
          name: 'valtionavustukset-private-subnet',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'valtionavustukset-public-subnet',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
      natGatewayProvider: natGateway,
    })

    this.vpc = vpc
    vpc.applyRemovalPolicy(RemovalPolicy.RETAIN)
  }
}
