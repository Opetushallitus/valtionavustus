#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

readonly SSH_SOCKET="$( mktemp -u )"
readonly SSH_TUNNEL_PORT="7777"
export PSQLRC="$repo/scripts/psqlrc"

function main {
  require_command psql
  parse_env_from_script_name "psql"

  trap cleanup EXIT
  "$repo/ssh.sh" $ENV app -M -S "$SSH_SOCKET" -fN -L $SSH_TUNNEL_PORT:localhost:5432

  [ ! -f "$PSQLRC" ] && fatal "psqlrc is missing"
  PGOPTIONS="--search-path=public,hakija,virkailija" \
  PGPASSWORD=va psql --set=sslmode=verify-ca -h localhost -p $SSH_TUNNEL_PORT -d va-$ENV -U va_hakija "$@"
}

function cleanup {
  set +o errexit
  ssh -S "$SSH_SOCKET" -O exit "oph-va-app-$ENV.csc.fi"
}

main "$@"
