import * as cdk from 'aws-cdk-lib'
import { Environment } from './va-env-stage'
import { ParameterGroup } from 'aws-cdk-lib/aws-rds'
import { aws_kms, Duration } from 'aws-cdk-lib'
import { SecurityGroup } from 'aws-cdk-lib/aws-ec2'

export const DB_NAME = 'va'
export const DB_USER = 'va_cluster_admin'

export class DbStack extends cdk.Stack {
  permitDBAccessSecurityGroup: cdk.aws_ec2.SecurityGroup
  clusterWriterEndpointHostname: string

  constructor(
    scope: Environment,
    id: string,
    vpc: cdk.aws_ec2.IVpc,
    dbSecurityGroup: SecurityGroup,
    storageEncryptionKey: aws_kms.Key,
    props?: cdk.StackProps
  ) {
    super(scope, id, props)
    const secret = new cdk.aws_rds.DatabaseSecret(this, 'Secret', {
      secretName: '/db/databaseSecrets',
      username: DB_USER,
    })

    const parameterGroup = new ParameterGroup(this, 'VaPostgresParameterGroup', {
      engine: cdk.aws_rds.DatabaseClusterEngine.auroraPostgres({
        version: cdk.aws_rds.AuroraPostgresEngineVersion.VER_15_5,
      }),
      description: 'Custom parameter group for VA Postgres',
      parameters: {},
    })

    const accessVaDBSecurityGroup = new cdk.aws_ec2.SecurityGroup(this, 'AccessVADBSecurityGroup', {
      description: 'Security group for accessing VA Postgres',
      vpc,
      allowAllOutbound: true,
      securityGroupName: 'access-va-db-security-group',
    })

    const serverlessV2MaxCapacity = scope.env === 'prod' ? 4 : 4

    const auroraV2Cluster = new cdk.aws_rds.DatabaseCluster(this, 'AuroraV2Cluster', {
      defaultDatabaseName: DB_NAME,
      engine: cdk.aws_rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      vpc,
      credentials: cdk.aws_rds.Credentials.fromSecret(secret),
      clusterIdentifier: 'va-aurora-cluster',
      vpcSubnets: { subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED },
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity,
      securityGroups: [dbSecurityGroup, accessVaDBSecurityGroup],
      writer: cdk.aws_rds.ClusterInstance.serverlessV2('writer', {
        enablePerformanceInsights: true,
      }),
      monitoringInterval: Duration.seconds(15),
      backup: {
        retention: Duration.days(14),
      },
      readers: [
        cdk.aws_rds.ClusterInstance.serverlessV2('reader', {
          enablePerformanceInsights: true,
        }),
      ],
      parameterGroup,
      storageEncryptionKey,
    })
    this.permitDBAccessSecurityGroup = accessVaDBSecurityGroup
    this.clusterWriterEndpointHostname = auroraV2Cluster.clusterEndpoint.hostname
  }
}
