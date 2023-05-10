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

    if [ "${GITHUB_ACTIONS:-}" == "true" ]; then
        ref_tag="$github_registry:$GITHUB_REF_NAME"
        docker pull "$ref_tag"
    else
        info "Building lein image locally"
        ref_tag="$revision" 
        docker build -t "$ref_tag" .
    fi

    start_gh_actions_group "Run lein tests"
    docker compose up -d db
    docker run --rm --network container:va-postgres "$ref_tag" with-profile test spec -f d
    docker compose down
    end_gh_actions_group
}
main "$@"