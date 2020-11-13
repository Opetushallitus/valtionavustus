#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

scriptdir="$( cd "$( dirname "$0" )" && pwd )"
repo="$scriptdir/.."
source "$scriptdir/common-functions.sh"

function main {
  init_nodejs

  cd "$repo"
  npm install
  npm run hakija:build-watch
}

main "$@"
