#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/common-functions.sh"
# shellcheck source=scripts/psql/db-tunnel-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/db-tunnel-functions.sh"

function main {
  export AWS_CONFIG_FILE="${VA_SECRETS_REPO}/aws_config"

  require_command jq
  require_command pg_dump

  parse_env_from_script_name "pg_dump-va"
  configure_aws
  require_aws_session "$ENV"
  start_db_tunnel

  echo "Connecting to VA db on [${ENV}]"

  export PSQLRC="${repo}/scripts/psql/psqlrc"
  if [ ! -f "$PSQLRC" ]; then fatal "File $PSQLRC not found"; fi

  fetch_db_credentials

  trap stop_db_tunnel EXIT

  pg_dump \
    -b \
    -Fc "${DBNAME}" \
    --no-privilege \
    --no-owner \
    -h 127.0.0.1 \
    -p ${SSH_TUNNEL_PORT} \
    -U "${USERNAME}" > ./valtionavustus-"${ENV}".dump
}

function require_reaktor_vpn {
  if [ "62.165.154.10" != $(curl --silent "https://checkip.amazonaws.com") ]; then
    fatal "Reaktor VPN required, aborting";
  fi
}

main "$@"
