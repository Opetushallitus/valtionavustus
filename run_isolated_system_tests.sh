#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
repo="$( cd "$( dirname "$0" )" && pwd )"

function initialize {
  export ADBLOCK=1
  cd "$repo"
  . ./init_nodejs.sh
}

function run_tests {
  make test
}

function main {
  initialize
  run_tests
}

main "$@"
