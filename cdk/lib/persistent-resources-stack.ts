import * as cdk from 'aws-cdk-lib'
import { Environment } from './va-env-stage'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import { aws_kms, aws_s3, Duration, RemovalPolicy } from 'aws-cdk-lib'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { Bucket } from 'aws-cdk-lib/aws-s3'

export class PersistentResourcesStack extends cdk.Stack {
  databasePasswordSecret: Secret
  applicationLogGroup: LogGroup
  loadBalancerAccessLogBucket: Bucket

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

    this.loadBalancerAccessLogBucket = new Bucket(this, 'alb-access-logs', {
      bucketName: `oph-va-loadbalancer-access-logs-${scope.env}`,
      encryption: aws_s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          enabled: true,
          expiration: Duration.days(365),
        },
      ],
    })
  }
}
