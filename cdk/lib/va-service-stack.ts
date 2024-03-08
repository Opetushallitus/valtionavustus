import * as cdk from 'aws-cdk-lib'
import { Environment } from './va-env-stage'

export class VaServiceStack extends cdk.Stack {
  constructor(scope: Environment, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
