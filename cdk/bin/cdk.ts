#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { VaServiceStack } from '../lib/va-service-stack'
import { OphDnsStack } from '../lib/oph-dns-stack'
import { Environment } from '../lib/va-env-stage'

const app = new cdk.App()
{
  const dev = new Environment(app, 'dev')
  new VaServiceStack(dev, 'va')
}

{
  const qa = new Environment(app, 'qa')
  new VaServiceStack(qa, 'va')
}

{
  const prod = new Environment(app, 'prod')
  new VaServiceStack(prod, 'va')
  new OphDnsStack(prod, 'oph-dns')
}
