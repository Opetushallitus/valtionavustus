import AWS from 'aws-sdk'
import * as process from 'process'

const ecsClusterName = 'valtionavustukset-cluster'

// Fetch all tasks in the cluster:
const ecs = new AWS.ECS()
async function getTasks() {
  return await ecs
    .listTasks({
      cluster: ecsClusterName,
    })
    .promise()
}

getTasks().then((tasks) => {
  const firstTask = tasks.taskArns![0]
  ecs.describeTasks({ cluster: ecsClusterName, tasks: [firstTask] }, (err, data) => {
    if (err) {
      console.error(err)
      process.exit(1)
    } else {
      const [taskId, containerRuntimeId] = data.tasks[0].containers[0].runtimeId.split('-')
      console.log(`${ecsClusterName}_${taskId}_${taskId}-${containerRuntimeId}`)
      process.exit(0)
    }
  })
})
