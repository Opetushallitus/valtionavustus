#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
repo="$( cd "$( dirname "$0" )" && pwd )"

function main {
  cd "$repo/scripts/postgres-docker"
  docker build -t va-postgres:9.4 .
  mkdir -p postgres-data
  docker run --rm --name va-postgres -p 5432:5432 -v "$PWD/postgres-data:/var/lib/postgresql/data" va-postgres:9.4
}

main "$@"
