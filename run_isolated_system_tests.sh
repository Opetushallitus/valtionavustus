#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

function run_tests {
  run_playwright_tests "$@"
  make lein-test
}

function run_playwright_tests {
  if running_on_jenkins;
  then
    start-service test-runner
  else
    npm run prettier-check-project "$@"
    npm run playwright:test "$@"
  fi
}

function main {
  init_nodejs
  run_tests "$@"
}

main "$@"
