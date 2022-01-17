#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"
readonly scriptdir="$repo/scripts"

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

  require_docker
  docker-compose down --remove-orphans || true
  docker-compose --profile $PROFILE up --force-recreate
}

main "$@"
