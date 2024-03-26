import * as cdk from 'aws-cdk-lib'
import { Environment } from './va-env-stage'
import { ParameterGroup } from 'aws-cdk-lib/aws-rds'

export const DB_NAME = 'va'
export const DB_USER = 'va_cluster_admin'
export class DbStack extends cdk.Stack {
  constructor(scope: Environment, id: string, vpc: cdk.aws_ec2.IVpc, props?: cdk.StackProps) {
    super(scope, id, props)
    const secret = new cdk.aws_rds.DatabaseSecret(this, 'Secret', {
      username: DB_USER,
    })

    const parameterGroup = new ParameterGroup(this, 'VaPostgresParameterGroup', {
      engine: cdk.aws_rds.DatabaseClusterEngine.auroraPostgres({
        version: cdk.aws_rds.AuroraPostgresEngineVersion.VER_16_1,
      }),
      description: 'Custom parameter group for VA Postgres',
      parameters: {},
    })

    const auroraPg = new cdk.aws_rds.ServerlessCluster(this, 'AuroraPg', {
      defaultDatabaseName: DB_NAME,
      engine: cdk.aws_rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      vpc,
      credentials: cdk.aws_rds.Credentials.fromSecret(secret),
      clusterIdentifier: 'va-cluster',
      vpcSubnets: { subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED },
      scaling: {
        autoPause: cdk.Duration.minutes(10),
        minCapacity: 2,
        maxCapacity: 6,
      },
      parameterGroup: parameterGroup,
    })
  }
}
