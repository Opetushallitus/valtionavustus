#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
scriptdir="$( cd "$( dirname "$0" )" && pwd )"
repo="$scriptdir/.."

function main {
  cd "$repo/soresu-form"
  ../lein install
  cd "$repo/va-common"
  ../lein install
  cd "$repo/va-hakija"
  ../lein run
}

main "$@"
