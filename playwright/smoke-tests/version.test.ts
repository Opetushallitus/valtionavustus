import { test, expect } from '@playwright/test'

const MILLISECONDS_IN_MINUTE = 60 * 1000
test.setTimeout(MILLISECONDS_IN_MINUTE)
test.describe.configure({ retries: 10 }) // wait for max 10 minutes for correct app version to be deployed

test('Application deployment', async ({ request }) => {
  const gitCommitHash = process.env['REVISION']

  async function getDeployedApplicationVersion() {
    const response = await request.get('/version.txt')
    return response.text()
  }

  await test.step('Current Git commit hash is defined', () => {
    expect(gitCommitHash).toBeDefined()
  })

  await test.step('Correct application version is deployed', async () => {
    await expect
      .poll(getDeployedApplicationVersion, {
        message: 'Correct application version is eventually deployed',
        timeout: 0, // no poll timeout, rely solely on test timeout
      })
      .toContain(gitCommitHash)
  })
})
