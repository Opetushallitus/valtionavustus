#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./deploy-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/deploy-functions.sh"

compose="docker compose -f docker-compose.yml -f docker-compose.local-dev.yml"

function cleanup {
    $compose down
}

function main {
    start_gh_actions_group "Setup"
    require_command docker
    require_docker_compose
    require_built_image
    end_gh_actions_group

    cd "$repo"

    start_gh_actions_group "Run CDK tests"
    "$repo/cdk/run-tests.sh"
    end_gh_actions_group
}

main "$@"
