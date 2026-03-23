#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
# shellcheck source=scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

function run_tests {
  run_playwright_tests "$@"
}

function run_playwright_tests {
  npx --no playwright install --with-deps chromium
  npm run playwright:test "$@"
}

function playwright_test_runner_exit_code {
  docker ps --filter "status=exited"|grep test-runner|sed 's/.*\(Exited.*\) Less.*/\1/'|sed 's/.*\([0-9][0-9]*\).*/\1/'
}

normalized_playwright_args=()
function normalize_playwright_args {
  # Support `./run_isolated_system_tests.sh --ui` as a readable shorthand
  # for npm's usual passthrough syntax: `./run_isolated_system_tests.sh -- --ui`.
  if [ "${1:-}" = "--ui" ]; then
    normalized_playwright_args=(-- "$@")
  else
    normalized_playwright_args=("$@")
  fi
}

function main {
  init_nodejs
  normalize_playwright_args "$@"
  run_tests "${normalized_playwright_args[@]}"
}

main "$@"
