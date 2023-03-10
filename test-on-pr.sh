#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

trap stop_systems_under_test EXIT

function main {
  check_requirements
  init_nodejs
  make_clean
  make_build
  npm run prettier-check-project
  build_docker_images

  docker-compose -f "${PLAYWRIGHT_COMPOSE_FILE}" up --abort-on-container-exit

  start_system_under_test "${DOCKER_COMPOSE_FILE}"
  run_tests
  stop_system_under_test "${DOCKER_COMPOSE_FILE}"
}

main "$@"
