#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

function main {
  wait_for_container_to_be_healthy va-postgres

  cd "$repo/soresu-form"
  ../lein install
  cd "$repo/va-common"
  ../lein install
  cd "$repo/va-hakija"
  ../lein run
}

main "$@"
