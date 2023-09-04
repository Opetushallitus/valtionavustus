#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

readonly compose="docker compose -f docker-compose.yml -f docker-compose.local-dev.yml"
function main {
  require_docker
  local container_name
  container_name="$($compose ps --quiet db)"

  docker exec -it --env PGOPTIONS="--search-path=public,hakija,virkailija" "$container_name" psql postgres://va:va@localhost/va-dev
}

main "$@"
