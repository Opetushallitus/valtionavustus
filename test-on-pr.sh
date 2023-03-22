#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

function main {
  check_requirements
  init_nodejs
  make_clean
  make_build
  start_system_under_test
  run_tests
  stop_system_under_test
}

main "$@"
