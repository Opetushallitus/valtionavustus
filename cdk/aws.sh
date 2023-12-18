#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

function main {
  parse_env_from_script_name "aws"

  require_docker
  require_federation_session

  AWS_PROFILE="oph-va-$ENV" aws "$@"
}

main "$@"
