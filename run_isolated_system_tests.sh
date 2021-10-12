#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

function run_tests {
	npm run playwright:test "$@"
	npm run puppeteer:test "$@"
	npm run soresu-form:test "$@"
	npm run common:test "$@"
	npm run hakija:test "$@"
	npm run virkailija:test "$@"
	make lein-test
}

function main {
  init_nodejs
  run_tests "$@"
}

main "$@"
