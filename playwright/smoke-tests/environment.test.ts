import { test, expect } from '@playwright/test'
import { SmokeTestConfig } from '../playwright.config'

const MILLISECONDS_IN_MINUTE = 60000
test.setTimeout(MILLISECONDS_IN_MINUTE * 2)

export const smokeTest = test.extend<SmokeTestConfig>({
  env: ['qa', { option: true }],
})

smokeTest('Smoke test for /environment API', async ({ request, env }) => {
  const conf = configurationForEnvironment[env]
  const backendEnvironmentResponse = await request.get('/environment')
  const backendEnvironment = await backendEnvironmentResponse.json()

  await test.step('endpoint responds with HTTP OK', async () => {
    expect(backendEnvironmentResponse.ok()).toBeTruthy()
  })

  await test.step('endpoint has correct environment', async () => {
    expect(backendEnvironment.environment).toBe(conf.backendEnvironment.environment)
  })
})

const configurationForEnvironment = {
  qa: {
    backendEnvironment: {
      environment: 'va-test',
    },
  },
  prod: {
    backendEnvironment: {
      environment: 'va-prod',
    },
  },
}
