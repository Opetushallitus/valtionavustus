#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

command -v docker > /dev/null 2>&1 || { echo >&2 "I require docker but it's not installed. Aborting."; exit 1; }
docker ps > /dev/null 2>&1 || { echo >&2 "Running 'docker ps' failed. Is docker daemon running? Aborting."; exit 1; }

scriptdir="$( cd "$( dirname "$0" )" && pwd )"

function main {
  cd "$scriptdir/postgres-docker"

  docker-compose down || true
  docker-compose up --force-recreate
}

main "$@"
