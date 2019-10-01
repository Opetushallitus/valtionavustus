#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
repo="$( cd "$( dirname "$0" )" && pwd )"

function usage {
  echo "Usage: $0 <env> <machine> [ssh-args...]"
  echo "Examples:"
  echo "  $0 qa ci"
  echo "  $0 prod app"
  exit 1
}

function main {
  if [ "${1:-}" = "" ]; then usage; fi
  if [ "${2:-}" = "" ]; then usage; fi

  local env="$1"
  local server_name="$2"

  case "$env-$server_name" in
    qa-ci)
      ssh oph-va-ci-test01 "${@:3}"
      ;;
    qa-app)
      ssh oph-va-app-test01 "${@:3}"
      ;;
    prod-app)
      ssh oph-va-app-prod01 "${@:3}"
      ;;
    prod-lb)
      ssh oph-va-lb-prod01 "${@:3}"
      ;;
    *)
      echo >&2 "error: Invalid environment or host ($env, $server_name)"
      exit 1
  esac
}

main "$@"
