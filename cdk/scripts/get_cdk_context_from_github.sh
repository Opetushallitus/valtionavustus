#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/common-functions.sh"

function get_and_set_variable {
  readonly var_name="$1"
  value="$(gh api "repos/opetushallitus/valtionavustus/actions/variables/$var_name" --jq '.value')"

  if [ -n "${GITHUB_ENV:-}" ]; then
    echo "::add-mask::$(echo -n "$value" | cut -c 3-)"
    echo "$var_name=$value" >> "$GITHUB_ENV"
  fi
  echo "$var_name=$value"
}

function main {
  get_and_set_variable "AWS_ACCOUNT_ID_DEV"
}

main
