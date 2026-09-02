import { describe, test } from 'node:test'
import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { GithubActionsAwsAuthCdkStack } from '../lib/bootstrap/github-actions-aws-auth-cdk-stack'
import { Environment } from '../lib/va-env-stage'

function createTemplate(): Template {
  process.env = {
    AWS_ACCOUNT_ID_DEV: '12345',
    AWS_ACCOUNT_ID_QA: '54321',
    AWS_ACCOUNT_ID_PROD: '67890',
    REVISION: 'test',
  }

  const app = new cdk.App()
  const env = new Environment(app, 'dev')
  return Template.fromStack(
    new GithubActionsAwsAuthCdkStack(env, 'github-actions-role', {
      repositoryConfig: {
        owner: 'Opetushallitus',
        repo: 'valtionavustus',
      },
    })
  )
}

describe('GitHub Actions AWS authentication', () => {
  test('uses a supported runtime for the generated OIDC provider handler', () => {
    createTemplate().hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs24.x',
    })
  })
})
