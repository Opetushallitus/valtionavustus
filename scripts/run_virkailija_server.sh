#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

function main {
  wait_for_container_to_be_healthy va-postgres

  info "Waiting for hakija server to start..."
  wait_until_port_is_listening 8080

  cd "$repo/va-virkailija"
  info "Starting virkailija server"
  ../lein run
}

main "$@"
