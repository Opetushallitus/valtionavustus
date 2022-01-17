#!/usr/bin/env bash

set -o nounset
set -o errexit

source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"
readonly scriptdir="$repo/scripts"

require_docker
cd "$scriptdir/postgres-docker"
echo "Stopping database"
docker-compose down || true
