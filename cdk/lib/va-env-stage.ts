import * as cdk from 'aws-cdk-lib'
import type { Construct } from 'constructs'
import { ValtionavustusEnvironment, setContext } from './va-context'

const DEFAULT_REGION = 'eu-west-1'

function maybeGetAccount(env: ValtionavustusEnvironment): string | undefined {
  return process.env[`AWS_ACCOUNT_ID_${env.toUpperCase()}`]
}

export class Environment extends cdk.Stage {
  constructor(scope: Construct, env: ValtionavustusEnvironment) {
    const account = maybeGetAccount(env)
    super(scope, env, { env: { region: DEFAULT_REGION, account } })

    setContext(this, env)
  }
}
