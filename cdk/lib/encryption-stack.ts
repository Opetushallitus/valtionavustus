import * as cdk from 'aws-cdk-lib'
import { aws_kms, Duration, RemovalPolicy } from 'aws-cdk-lib'
import { Environment } from './va-env-stage'
import { KeySpec } from 'aws-cdk-lib/aws-kms'
import { PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam'

export class EncryptionStack extends cdk.Stack {
  public readonly dbEncryptionKey: aws_kms.Key
  public readonly logGroupEncryptionKey: aws_kms.Key
  constructor(scope: Environment, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    this.dbEncryptionKey = new aws_kms.Key(this, 'DB_KEY', {
      keySpec: KeySpec.SYMMETRIC_DEFAULT,
      alias: 'Database-encryption-key',
      description: 'Encryption key Aurora PostgreSQL',
      removalPolicy: RemovalPolicy.RETAIN,
      pendingWindow: Duration.days(30),
    })

    this.logGroupEncryptionKey = new aws_kms.Key(this, 'LOG_GROUP_KEY', {
      keySpec: KeySpec.SYMMETRIC_DEFAULT,
      alias: 'Log-group-encryption-key',
      description: 'Encryption key logs',
      removalPolicy: RemovalPolicy.RETAIN,
      pendingWindow: Duration.days(30),
    })

    this.logGroupEncryptionKey.addToResourcePolicy(
      new PolicyStatement({
        principals: [new ServicePrincipal(`logs.${scope.region}.amazonaws.com`)],
        actions: [
          'kms:Encrypt*',
          'kms:Decrypt*',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:Describe*',
        ],
        resources: ['*'],
        conditions: {
          ArnEquals: {
            'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${scope.region}:${scope.account}:log-group:*`,
          },
        },
      })
    )
  }
}
