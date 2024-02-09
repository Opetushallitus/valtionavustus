import { PlaywrightTestConfig } from '@playwright/test'

const headless = process.env['HEADLESS'] === 'true'
const workersEnv = process.env['PLAYWRIGHT_WORKERS']
const workersEnvNumber = Number(workersEnv)
const workers = isNaN(workersEnvNumber) ? workersEnv : workersEnvNumber
const retriesEnv = Number(process.env['PLAYWRIGHT_RETRIES'])
const retries = isNaN(retriesEnv) ? 1 : retriesEnv
const allowOnly = process.env['ALLOW_ONLY'] === 'true'
const quiet = process.env['VERBOSE'] !== 'true'

const shard = (function () {
  const shardNumber = process.env['PLAYWRIGHT_SHARD']
  const shardAmount = process.env['PLAYWRIGHT_SHARDS_AMOUNT']

  if (shardNumber && shardAmount) {
    return {
      current: parseInt(shardNumber, 10),
      total: parseInt(shardAmount, 10),
    }
  }
  return null
})()

export interface SmokeTestConfig {
  env: 'qa' | 'prod'
}

function generateMetadata() {
  const { GITHUB_SHA, GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env

  const ciLink =
    GITHUB_SERVER_URL && GITHUB_REPOSITORY && GITHUB_RUN_ID
      ? `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`
      : undefined

  return {
    'revision.id': GITHUB_SHA,
    'revision.author': undefined,
    'revision.email': undefined,
    'revision.subject': undefined,
    'revision.timestamp': undefined,
    'revision.link': undefined,
    'ci.link': ciLink,
    timestamp: Date.now(),
  }
}

const config: PlaywrightTestConfig<SmokeTestConfig> = {
  metadata: generateMetadata(),
  expect: {
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.015,
    },
  },
  forbidOnly: !allowOnly,
  retries,
  workers,
  projects: [
    {
      name: 'smoke-test-qa',
      testDir: 'smoke-tests',
      use: {
        env: 'qa',
        baseURL: 'https://testi.virkailija.valtionavustukset.oph.fi/',
      },
    },
    {
      name: 'smoke-test-prod',
      testDir: 'smoke-tests',
      use: {
        env: 'prod',
        baseURL: 'https://virkailija.valtionavustukset.oph.fi/',
      },
    },
    {
      name: 'Default',
      testDir: 'tests',
    },
  ],
  timeout: 90000,
  quiet,
  shard,
  use: {
    actionTimeout: 10000,
    navigationTimeout: 10000,
    headless,
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    video: 'off',
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
    trace: 'retain-on-failure',
    testIdAttribute: 'data-test-id',
  },
  reportSlowTests: {
    max: 0,
    threshold: 120000,
  },
  reporter: [
    ['list'],
    [
      'junit',
      {
        outputFile: 'playwright-results/junit-playwright-js-unit.xml',
      },
    ],
    [
      'html',
      {
        outputFolder: '../playwright-results/html-report/',
        open: 'never',
      },
    ],
    [
      'blob',
      {
        outputDir: '../playwright-results/blob-report',
      },
    ],
  ],
}

export default config
