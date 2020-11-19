#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
scriptdir="$( cd "$( dirname "$0" )" && pwd )"
repo="$scriptdir/.."

function main {
  command -v nc > /dev/null 2>&1 || { echo >&2 "I require nc but it's not installed. Aborting."; exit 1; }

  wait_for_hakija_server_to_be_started

  cd "$repo/va-virkailija"
  ../lein run
}

function wait_for_hakija_server_to_be_started {
  local -r hakija_server_port="8080"

  echo "wating for hakija server to accept connections on port $hakija_server_port"
  while ! nc -z localhost $hakija_server_port; do
    sleep 1
  done
}

main "$@"
