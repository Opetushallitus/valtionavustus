#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

service_name="db"
while getopts "r" opt
do
    case $opt in
    (r) service_name="db_restore-backup" ;;
    (*) printf "Illegal option '-%s'\n" "$opt" && exit 1 ;;
    esac
done

function main {
  start-service ${service_name}
}

main "$@"
