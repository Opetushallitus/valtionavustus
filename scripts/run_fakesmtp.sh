#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
scriptdir="$( cd "$( dirname "$0" )" && pwd )"
repo="$scriptdir/.."

function main {
  pushd "$repo"
  docker-compose -f docker-compose-test.yml up --force-recreate fakesmtp
  popd
}

main "$@"
