import * as util from 'util'
import { execFile as callbackExecFile } from 'node:child_process'
const execFile = util.promisify(callbackExecFile)

type Env = 'dev' | 'qa' | 'prod'
const successIcon = '✅'
const failureIcon = '❌'
const env = getEnv()
const webhook = getWebhookURL()
const currentCommitHash = getCurrentCommitHash()

async function main() {
  const statusMessage = isSuccessfullyDeployed() ? 'Deployment success' : 'Deployment failure'
  const icon = isSuccessfullyDeployed() ? successIcon : failureIcon
  const changes = await getChangedGitCommitMessagesWithAuthor()
  const SECOND_IN_MILLIS = 1000

  const payload = {
    text: `${statusMessage} ${icon}\n\n` + `${changes}`,
  }

  const response = await fetch(webhook, {
    method: 'POST',
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10 * SECOND_IN_MILLIS),
  })

  console.log(`Message posted to Slack with response status code ${response.status}`)
}

async function getChangedGitCommitMessagesWithAuthor(): Promise<string> {
  const previouslyDeployedAppTag = `va-green-${env}`
  const commitMessageSubject = '%s'
  const commitAuthorMailLocalPart = '%cl'
  const format = `${commitMessageSubject} [${commitAuthorMailLocalPart}]`

  const { stdout } = await execFile('git', [
    '--no-pager',
    '-c',
    'log.showSignature=false',
    'log',
    '--left-only',
    `--pretty=format:${format}`,
    `${currentCommitHash}...${previouslyDeployedAppTag}`,
  ])

  return stdout // newline separated string of commit messages & authors
}

function isSuccessfullyDeployed(): boolean {
  return process.env['APP_SUCCESSFULLY_DEPLOYED'] === 'true'
}

function getWebhookURL(): string {
  const webhook = process.env['OPH_SLACK_WEBHOOK']
  if (!webhook) {
    console.error('You must set OPH_SLACK_WEBHOOK for every env in Github environment secrets')
    throw new Error(`OPH_SLACK_WEBHOOK environment variable missing for '${env}', cannot continue`)
  }

  return webhook
}

function getEnv(): Env {
  if (process.env.ENVIRONMENT === 'dev') return 'dev'
  if (process.env.ENVIRONMENT === 'qa') return 'qa'
  if (process.env.ENVIRONMENT === 'prod') return 'prod'

  throw new Error(`Unknown environment ${process.env.ENVIRONMENT}, cannot continue`)
}

function getCurrentCommitHash(): string {
  const hash = process.env['COMMIT_HASH']
  if (!hash) throw new Error(`COMMIT_HASH is missing, cannot continue`)

  return hash
}

main()
  .then(() => console.info(`Deployment status posted to Slack`))
  .catch((e) => {
    console.error(`Failed to post deployment status to Slack`, e)
    process.exit(1)
  })
