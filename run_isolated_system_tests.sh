#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

function run_tests {
	if running_on_jenkins;
		then
			docker-compose -f docker-compose-test.yml run test-runner ./run_playwright_tests_in_container.sh
		else
			npm run playwright:test
	fi
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
