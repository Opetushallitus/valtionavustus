#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( dirname "${BASH_SOURCE[0]}" )/common-functions.sh"

function main {
  cd "$repo"
  ./lein cljfmt fix
}

main "$@"
