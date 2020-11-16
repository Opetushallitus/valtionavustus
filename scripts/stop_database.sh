#!/usr/bin/env bash

set -o nounset
set -o errexit

scriptdir=$( cd "$( dirname "$0" )" && pwd )

command -v docker > /dev/null 2>&1 || { echo >&2 "I require docker but it's not installed. Aborting."; exit 1; }
docker ps > /dev/null 2>&1 || { echo >&2 "Running 'docker ps' failed. Is docker daemon running? Aborting."; exit 1; }

cd "$scriptdir/postgres-docker"
echo "Stopping database"
docker-compose down || true
