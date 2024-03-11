import * as cdk from 'aws-cdk-lib'
import type { Construct } from 'constructs'
import { ValtionavustusEnvironment, setContext } from './va-context'

const DEFAULT_REGION = 'eu-west-1'

function getAccount(env: ValtionavustusEnvironment): string {
  const envName = `AWS_ACCOUNT_ID_${env.toUpperCase()}`
  const accountId = process.env[envName]
  if (!accountId) {
    throw new Error(`Missing ${envName}`)
  }

  return accountId
}

function getAccountIds(): Record<ValtionavustusEnvironment, string> {
  return {
    dev: getAccount('dev'),
    qa: getAccount('qa'),
    prod: getAccount('prod'),
  }
}

export class Environment extends cdk.Stage {
  env: ValtionavustusEnvironment

  constructor(scope: Construct, env: ValtionavustusEnvironment) {
    const account = getAccount(env)
    super(scope, env, { env: { region: DEFAULT_REGION, account } })
    this.env = env

    setContext(this, env, getAccountIds())
  }
}
