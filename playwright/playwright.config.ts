import { PlaywrightTestConfig } from '@playwright/test';

const headless = process.env['HEADLESS'] === 'true'
const workersEnv = Number(process.env['PLAYWRIGHT_WORKERS'])
const workers = isNaN(workersEnv) ? undefined : workersEnv

const config: PlaywrightTestConfig = {
  retries: 2,
  workers,
  testDir: 'tests',
  outputDir: '/test-results',
  timeout: 60000,
  use: {
    actionTimeout: 10000,
    navigationTimeout: 10000,
    headless,
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    video: 'off',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  reportSlowTests: {
    max: 0,
    threshold: 120000
  },
  reporter: [
    ['list'],
    ['junit', {
      outputFile: '/test-results/junit-playwright-js-unit.xml'
    }]
  ]
};

export default config;
