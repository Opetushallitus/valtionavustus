#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

function run_tests {
  if ! running_on_jenkins;
    then
      npm run prettier-check-project "$@"
      npm run playwright:test "$@"
  fi
	npm run soresu-form:test "$@"
	make lein-test
}

function main {
  init_nodejs
  run_tests "$@"
}

main "$@"
