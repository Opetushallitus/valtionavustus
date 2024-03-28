import * as process from 'process'
import { DescribeTasksCommand, ECSClient, ListTasksCommand } from '@aws-sdk/client-ecs'

const client = new ECSClient({ region: 'eu-west-1' })
const ecsClusterName = 'valtionavustukset-cluster'

async function getBastionTask() {
  const tasks = await client.send(
    new ListTasksCommand({
      cluster: ecsClusterName,
    })
  )

  const describedTasks = await client.send(
    new DescribeTasksCommand({
      cluster: ecsClusterName,
      tasks: tasks.taskArns,
    })
  )

  const bastionTask = describedTasks?.tasks?.find((t) => t.group === 'service:bastion')
  if (!bastionTask) throw new Error('No bastion tasks found, cannot continue')

  return bastionTask
}

getBastionTask()
  .then((bastionTask) => {
    const bastionRuntimeId = bastionTask?.containers?.[0]?.runtimeId
    if (!bastionRuntimeId) throw new Error('No bastion container runtime ID found, cannot continue')

    const [taskId, containerRuntimeId] = bastionRuntimeId.split('-')
    console.log(`${ecsClusterName}_${taskId}_${taskId}-${containerRuntimeId}`)
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
