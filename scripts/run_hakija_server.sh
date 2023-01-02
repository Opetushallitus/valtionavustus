#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

function main {
  wait_for_container_to_be_healthy va-postgres

  cd "$repo"
  ./lein with-profile hakija-dev run -m oph.va.hakija.main
}

main "$@"
