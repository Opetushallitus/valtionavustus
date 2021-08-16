const NodeEnvironment = require('jest-environment-node')

class FailedTestContextEnvironment extends NodeEnvironment {
  handleTestEvent(event) {
    if (event.name === 'test_start') {
      this.global.previousTestFailed = false
      this.global.previousHookFailed = false
    }
    if (event.name === 'test_fn_failure') {
      this.global.previousTestFailed = true
    }
    if (event.name === 'hook_failure') {
      this.global.previousHookFailed = true
    }
  }
}

module.exports = FailedTestContextEnvironment