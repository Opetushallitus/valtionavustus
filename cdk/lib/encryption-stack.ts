import * as cdk from 'aws-cdk-lib'
import { aws_kms, Duration, RemovalPolicy } from 'aws-cdk-lib'
import { Environment } from './va-env-stage'
import { KeySpec } from 'aws-cdk-lib/aws-kms'

export class EncryptionStack extends cdk.Stack {
  public readonly dbEncryptionKey: aws_kms.Key

  constructor(scope: Environment, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    this.dbEncryptionKey = new aws_kms.Key(this, 'DB_KEY', {
      keySpec: KeySpec.SYMMETRIC_DEFAULT,
      alias: 'Database-encryption-key',
      description: 'Encryption key Aurora PostgreSQL',
      removalPolicy: RemovalPolicy.RETAIN,
      pendingWindow: Duration.days(30),
    })
  }
}
