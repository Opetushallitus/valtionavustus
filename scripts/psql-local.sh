#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

function main {
  require_docker
  docker exec -it --env PGOPTIONS="--search-path=public,hakija,virkailija" va-postgres psql postgres://va:va@localhost/va-dev
}

main "$@"
