#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

command -v docker > /dev/null 2>&1 || { echo >&2 "I require docker but it's not installed. Aborting."; exit 1; }
docker ps > /dev/null 2>&1 || { echo >&2 "Running 'docker ps' failed. Is docker daemon running? Aborting."; exit 1; }

repo="$( cd "$( dirname "$0" )" && pwd )"

PG_DATA_DIR=postgres-data-12-2
MY_UID=`id -u`
MY_GID=`id -g`

function main {
  cd "$repo/scripts/postgres-docker"
  docker build -t va-postgres:12.2 .
  mkdir -p ${PG_DATA_DIR}

  export PG_DATA_DIR
  export MY_UID
  export MY_GID

  docker-compose down || true
  docker-compose up --force-recreate
}

main "$@"
