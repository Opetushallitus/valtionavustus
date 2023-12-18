#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

function require_cdk_context {
  if ! running_on_gh_actions; then
    source "$VA_SECRETS_REPO/cdk_context.sh"
  fi
}

function main {
  init_nodejs
  npm_ci_if_package_lock_has_changed

  require_cdk_context

  npm run cdk -- "$@"
}

main "$@"