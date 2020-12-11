#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
scriptdir="$( cd "$( dirname "$0" )" && pwd )"
repo="$scriptdir/.."

function main {
  pushd "$repo/fakesmtp"

  docker-compose up --force-recreate
}

main "$@"
