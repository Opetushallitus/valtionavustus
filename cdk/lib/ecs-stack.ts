import * as cdk from 'aws-cdk-lib'
import { Environment } from './va-env-stage'
import { Cluster } from 'aws-cdk-lib/aws-ecs'

export class EcsStack extends cdk.Stack {
  ecsCluster: Cluster

  constructor(scope: Environment, id: string, vpc: cdk.aws_ec2.IVpc, props?: cdk.StackProps) {
    super(scope, id, props)

    this.ecsCluster = new Cluster(this, 'va-cluster', {
      clusterName: 'valtionavustukset-cluster',
      vpc: vpc,
    })
  }
}
