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

export class Environment extends cdk.Stage {
  constructor(scope: Construct, env: ValtionavustusEnvironment) {
    const account = getAccount(env)
    super(scope, env, { env: { region: DEFAULT_REGION, account } })

    setContext(this, env)
  }
}
