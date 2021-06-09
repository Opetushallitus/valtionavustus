#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

command -v docker > /dev/null 2>&1 || { echo >&2 "I require docker but it's not installed. Aborting."; exit 1; }
docker ps > /dev/null 2>&1 || { echo >&2 "Running 'docker ps' failed. Is docker daemon running? Aborting."; exit 1; }

scriptdir="$( cd "$( dirname "$0" )" && pwd )"

PROFILE="dev"
while getopts "r" opt
do
    case $opt in
    (r) PROFILE="restore-backup" ;;
    (*) printf "Illegal option '-%s'\n" "$opt" && exit 1 ;;
    esac
done

function main {
  cd "$scriptdir/postgres-docker"

  docker-compose down --remove-orphans || true
  docker-compose --profile $PROFILE up --force-recreate
}

main "$@"
