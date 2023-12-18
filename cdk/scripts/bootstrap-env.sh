#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/common-functions.sh"

readonly gh_org="opetushallitus"
readonly gh_repo="valtionavustus"

function verify {
  read -r -p "> $1 " answer
}

function main {
  require_command gh

  export PAGER=""

  if ! gh auth status; then
    fatal "Not authenticated with Github CLI"
  fi

  verify "Environment name:"
  if [ -z "$answer" ]; then
    fatal "Environment name can't be empty"
  fi
  readonly env_name="$answer"

  info "Bootstrapping '$env_name' environment"

  verify "Create environment $env_name in Github repository $gh_org/$gh_repo?"
  gh api --method PUT "repos/$gh_org/$gh_repo/environments/$env_name"

}

main "$@"
