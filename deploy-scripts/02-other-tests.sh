#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./deploy-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/deploy-functions.sh"

function cleanup {
    docker compose down
}

function main {
    start_gh_actions_group "Setup"
    require_command docker
    require_docker_compose
    require_built_image
    end_gh_actions_group
    
    cd "$repo"

    readonly test_image_tag="va-server-speclj:$revision"

    start_gh_actions_group "Build test image"
    docker build --tag "$test_image_tag" \
        --build-arg "VA_SERVER_IMAGE=$image_tag" \
        --file Dockerfile.lein-spec "$repo"
    end_gh_actions_group

    start_gh_actions_group "Run lein tests"
    trap cleanup EXIT
    docker compose up --wait db
    docker run --rm --network container:va-postgres "$test_image_tag"
    end_gh_actions_group
}

main "$@"
