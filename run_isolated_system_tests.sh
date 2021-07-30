#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
repo="$( cd "$( dirname "$0" )" && pwd )"

function initialize {
  export ADBLOCK=1
  cd "$repo"
  . ./init_nodejs.sh
}

function run_tests {
	npm run puppeteer:test "$@"
	#npm run soresu-form:test "$@"
	#npm run common:test "$@"
	#npm run hakija:test "$@"
	#npm run virkailija:test "$@"
}

function main {
  initialize
  run_tests "$@"
  #make lein-test
}

main "$@"
