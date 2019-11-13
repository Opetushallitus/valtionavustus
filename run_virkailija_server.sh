#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
repo="$( cd "$( dirname "$0" )" && pwd )"

function main {
  cd "$repo/soresu-form"
  ../lein install
  cd "$repo/va-common"
  ../lein install
  cd "$repo/va-virkailija"
  ../lein run
}

main "$@"
