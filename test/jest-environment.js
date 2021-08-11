const NodeEnvironment = require('jest-environment-node')

class FailedTestContextEnvironment extends NodeEnvironment {
  handleTestEvent(event) {
    if (event.name === 'test_fn_start') {
      this.global.previousTestFailed = false
    }
    if (event.name === 'test_fn_failure') {
      this.global.previousTestFailed = true
    }
  }
}

module.exports = FailedTestContextEnvironment