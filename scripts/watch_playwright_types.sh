#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( dirname "${BASH_SOURCE[0]}" )/common-functions.sh"

function main {
  init_nodejs
  cd "$repo"
  npm_ci_if_package_lock_has_changed
  npx tsc --watch --project playwright/tsconfig.json
}

main "$@"
