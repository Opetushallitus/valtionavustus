#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

trap extract_docker_compose_logs EXIT

readonly RESULTS_DIR="$repo/playwright-results"
function extract_docker_compose_logs {
  cd "$repo"
  docker-compose --file "$DOCKER_COMPOSE_FILE" logs --timestamps > "$RESULTS_DIR/docker-compose-logs.txt"
}

function main {
  mkdir -p "$RESULTS_DIR"

  start_gh_actions_group "build"
  build_jars
  init_nodejs
  end_gh_actions_group

  start_gh_actions_group "run prettier"
  npm run prettier-check-project
  end_gh_actions_group


  start_gh_actions_group "run playwright tests"
  readonly test_runner_service="test-runner"
  docker-compose --file "${DOCKER_COMPOSE_FILE}" up \
    --exit-code-from $test_runner_service \
    --build $test_runner_service
  end_gh_actions_group
}

main "$@"
