/**
 * https://github.com/aws-samples/github-actions-oidc-cdk-construct/blob/84aafde7fc515f080d81c4b519d00f555aa30ff2/lib/github-actions-aws-auth-cdk-stack.ts
 */

import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { aws_iam as iam } from 'aws-cdk-lib'
import { getEnv } from '../va-context'

export interface GithubActionsAwsAuthCdkStackProps extends cdk.StackProps {
  readonly repositoryConfig: { owner: string; repo: string }
}

export class GithubActionsAwsAuthCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: GithubActionsAwsAuthCdkStackProps) {
    super(scope, id, props)

    const githubDomain = 'token.actions.githubusercontent.com'
    const url = `https://${githubDomain}`

    const githubProvider = new iam.OpenIdConnectProvider(this, 'GithubActionsProvider', {
      url,
      clientIds: ['sts.amazonaws.com'],
    })
    const { owner, repo } = props.repositoryConfig
    const environment = getEnv(this)
    const iamRepoDeployAccess = `repo:${owner}/${repo}:environment:${environment}`

    const conditions: iam.Conditions = {
      StringEquals: {
        [`${githubDomain}:sub`]: iamRepoDeployAccess,
        [`${githubDomain}:aud`]: 'sts.amazonaws.com',
      },
    }

    const role = new iam.Role(this, 'gitHubDeployRole', {
      assumedBy: new iam.WebIdentityPrincipal(githubProvider.openIdConnectProviderArn, conditions),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess')],
      roleName: 'githubActionsDeployRole',
      description:
        'This role is used via GitHub Actions to deploy with AWS CDK or Terraform on the target AWS account',
      maxSessionDuration: cdk.Duration.hours(2),
    })

    new cdk.CfnOutput(this, 'GithubActionOidcIamRoleArn', {
      value: role.roleArn,
      description: `Arn for AWS IAM role with Github oidc auth for ${iamRepoDeployAccess}`,
      exportName: 'GithubActionOidcIamRoleArn',
    })

    cdk.Tags.of(this).add('component', 'CdkGithubActionsOidcIamRole')
  }
}
