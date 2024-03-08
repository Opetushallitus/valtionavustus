#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { VaServiceStack } from '../lib/va-service-stack'
import { OphDnsStack } from '../lib/oph-dns-stack'
import { Environment } from '../lib/va-env-stage'
import { DnsStack } from '../lib/dns-stack'

const HAKIJA_DOMAIN = 'valtionavustukset.oph.fi'
const VIRKAILIJA_DOMAIN = 'virkailija.valtionavustukset.oph.fi'

const app = new cdk.App()
{
  const dev = new Environment(app, 'dev')
  new VaServiceStack(dev, 'va')
  const dns = new DnsStack(dev, 'dns', {
    hakijaDomain: `dev.${HAKIJA_DOMAIN}`,
    virkailijaDomain: `dev.${VIRKAILIJA_DOMAIN}`,
  })
}

{
  const qa = new Environment(app, 'qa')
  new VaServiceStack(qa, 'va')
  const dns = new DnsStack(qa, 'dns', {
    hakijaDomain: `testi.${HAKIJA_DOMAIN}`,
    virkailijaDomain: `testi.${VIRKAILIJA_DOMAIN}`,
  })
}

{
  const prod = new Environment(app, 'prod')
  new VaServiceStack(prod, 'va')
  new OphDnsStack(prod, 'oph-dns')
  const dns = new DnsStack(prod, 'dns', {
    hakijaDomain: HAKIJA_DOMAIN,
    virkailijaDomain: VIRKAILIJA_DOMAIN,
  })
}
