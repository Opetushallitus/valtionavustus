#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./deploy-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/deploy-functions.sh"

function main {
    require_command docker
    require_docker_compose
    
    cd "$repo"
    start_gh_actions_group "Run lein tests"

    start_system_under_test
    make lein-test
    stop_system_under_test

    end_gh_actions_group
}
main "$@"