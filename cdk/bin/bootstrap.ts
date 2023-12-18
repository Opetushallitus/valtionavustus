#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { Environment } from '../lib/va-env-stage'
import {
  GithubActionsAwsAuthCdkStack,
  GithubActionsAwsAuthCdkStackProps,
} from '../lib/bootstrap/github-actions-aws-auth-cdk-stack'

const repositoryConfig = {
  owner: 'opetushallitus',
  repo: 'valtionavustus',
} satisfies GithubActionsAwsAuthCdkStackProps['repositoryConfig']

const app = new cdk.App()

{
  const dev = new Environment(app, 'dev')
  new GithubActionsAwsAuthCdkStack(dev, 'github-actions-role', {
    repositoryConfig,
  })
}

{
  const qa = new Environment(app, 'qa')
  new GithubActionsAwsAuthCdkStack(qa, 'github-actions-role', {
    repositoryConfig,
  })
}

{
  const prod = new Environment(app, 'prod')
  new GithubActionsAwsAuthCdkStack(prod, 'github-actions-role', {
    repositoryConfig,
  })
}
