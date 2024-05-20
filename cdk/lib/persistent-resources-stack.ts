import * as cdk from 'aws-cdk-lib'
import { Environment } from './va-env-stage'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import { aws_kms, RemovalPolicy } from 'aws-cdk-lib'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'

export class PersistentResourcesStack extends cdk.Stack {
  databasePasswordSecret: Secret
  applicationLogGroup: LogGroup

  constructor(
    scope: Environment,
    id: string,
    storageEncryptionKey: aws_kms.Key,
    props?: cdk.StackProps
  ) {
    super(scope, id, props)

    // This password has been manually set using psql-va-[env].sh and CREATE USER 'va_application'
    this.databasePasswordSecret = new Secret(this, 'va-db-user-password', {
      secretName: '/db/password',
      description: 'Valtionavustukset application DB password (username va_application)',
      generateSecretString: {
        passwordLength: 64,
        requireEachIncludedType: true,
        includeSpace: false,
        excludePunctuation: true,
      },
      removalPolicy: RemovalPolicy.RETAIN,
    })

    this.applicationLogGroup = new LogGroup(this, 'va-log-group', {
      logGroupName: '/fargate/valtionavustukset-application',
      encryptionKey: storageEncryptionKey,
      retention: RetentionDays.ONE_YEAR,
      removalPolicy: RemovalPolicy.RETAIN,
    })
  }
}
