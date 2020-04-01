#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
repo="$( cd "$( dirname "$0" )" && pwd )"

PG_DATA_DIR=postgres-data-12-2
MY_UID=`id -u`
MY_GID=`id -g`

function main {
  cd "$repo/scripts/postgres-docker"
  docker build -t va-postgres:12.2 .
  mkdir -p ${PG_DATA_DIR}

  docker run --rm \
    --name va-postgres \
    --user "${MY_UID}:${MY_GID}" \
    -e POSTGRES_USER=va \
    -e POSTGRES_PASSWORD=va \
    -p 5432:5432 \
    -v "$PWD/${PG_DATA_DIR}:/var/lib/postgresql/data" \
    -v /etc/passwd:/etc/passwd:ro \
    va-postgres:12.2

}

main "$@"
