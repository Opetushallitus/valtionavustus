#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
repo="$( cd "$( dirname "$0" )" && pwd )"
source "$repo/scripts/common-functions.sh"

function main {
  init_nodejs

  cd "$repo"
  npm install
  npm run hakija:build-watch
}

main "$@"
