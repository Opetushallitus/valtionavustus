#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

function main {
  build_jars

  if [ -n "${GITHUB_SHA:-}" ]; then
    export HAKIJA_IMAGE="ghcr.io/opetushallitus/va-hakija:$GITHUB_SHA"

    docker compose --file "$DOCKER_COMPOSE_FILE" pull --ignore-pull-failures
  fi

  readonly test_runner_service="test-runner"
  docker-compose --file "$DOCKER_COMPOSE_FILE" up \
    --exit-code-from $test_runner_service \
    --build $test_runner_service
}

main "$@"
