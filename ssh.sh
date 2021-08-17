#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

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

  local -r ssh_args="-F $repo/servers/ssh.config"

  case "$env-$server_name" in
    qa-ci)
      ssh $ssh_args oph-va-ci-test01 "${@:3}"
      ;;
    qa-app)
      ssh $ssh_args oph-va-app-test01 "${@:3}"
      ;;
    prod-app)
      ssh $ssh_args oph-va-app-prod01 "${@:3}"
      ;;
    prod-lb)
      ssh $ssh_args oph-va-lb-prod01 "${@:3}"
      ;;
    *)
      fatal "error: Invalid environment or host ($env, $server_name)"
  esac
}

main "$@"
