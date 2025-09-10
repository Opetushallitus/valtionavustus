#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( dirname "${BASH_SOURCE[0]}" )/common-functions.sh"

function main {
  cd "$repo"
  build_and_refresh_pom_and_bom
}

main "$@"
