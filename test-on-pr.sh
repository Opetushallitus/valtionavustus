#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

function main {
  build_jars

  readonly test_runner_service="test-runner"
  docker-compose --file "${DOCKER_COMPOSE_FILE}" up \
    --exit-code-from $test_runner_service \
    --build $test_runner_service
}

main "$@"
