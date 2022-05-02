#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

function run_tests {
  if ! running_on_jenkins;
    then
      npm run playwright:test "$@"
  fi
	npm run puppeteer:test "$@"
	npm run soresu-form:test "$@"
	npm run hakija:test "$@"
	npm run virkailija:test "$@"
	make lein-test
}

function main {
  init_nodejs
  npm run prettier-check-project "$@"
  run_tests "$@"
}

main "$@"
