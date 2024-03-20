import * as cdk from 'aws-cdk-lib'
import { RemovalPolicy } from 'aws-cdk-lib'
import { Environment } from './va-env-stage'
import { SubnetType } from 'aws-cdk-lib/aws-ec2'

export class VpcStack extends cdk.Stack {
  public vpc: cdk.aws_ec2.Vpc

  constructor(scope: Environment, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const vpc = new cdk.aws_ec2.Vpc(this, 'VPC', {
      subnetConfiguration: [
        {
          name: 'valtionavustukset-isolated-subnet',
          subnetType: SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    })

    this.vpc = vpc
    vpc.applyRemovalPolicy(RemovalPolicy.RETAIN)
  }
}
