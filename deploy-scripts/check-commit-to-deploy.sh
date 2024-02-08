#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./deploy-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/deploy-functions.sh"

function main {
  readonly commit_to_check="$1"

  parse_env_from_script_name "check-commit-to-deploy"
  check_env

  require_command gh
  if ! gh auth status; then
    fatal "Not authenticated with Github CLI"
  fi

  readonly deployed_tag="va-green-$ENV"
  comparison_response="$(gh api --method GET "/repos/opetushallitus/valtionavustus/compare/$deployed_tag...$commit_to_check")"

  target_status="$(jq --raw-output '.status' - <<< "$comparison_response")"

  if [[ "$target_status" == "ahead" ]]; then
    info "$commit_to_check is ahead of $deployed_tag"
  else
    fatal "Status of $deployed_tag...$commit_to_check is \"$target_status\". Only target commits that are ahead of current deployment are accepted."
  fi
}

main "$@"
