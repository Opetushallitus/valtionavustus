#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/common-functions.sh"

function main {
  SSH_TUNNEL_PORT=40077

  function start_db_tunnel {
    docker-compose -f "${repo}/scripts/psql/docker-compose.yml" up --build --detach --wait
    wait_until_port_is_listening "${SSH_TUNNEL_PORT}"
    docker-compose logs
  }

  function stop_db_tunnel {
    docker-compose -f "${repo}/scripts/psql/docker-compose.yml" down
  }

  require_command jq
  require_command psql
  require_reaktor_vpn

  parse_env_from_script_name "psql-va"
  configure_aws
  start_db_tunnel

  echo "Connecting to VA db on [${ENV}]"

  export PSQLRC="${repo}/scripts/psql/psqlrc"
  if [ ! -f "$PSQLRC" ]; then fatal "File $PSQLRC not found"; fi

  if [[ ${ENV} = "dev" ]]; then
    SECRET_NAME="SecretA720EF05-rtkostJfA2hp"
  elif [[ ${ENV} = "qa"  ]]; then
    SECRET_NAME="SecretA720EF05-190KlLt98ngt"
  elif [[ ${ENV} = "prod"  ]]; then
    SECRET_NAME="SecretA720EF05-8IPOrirGbwh0"
  fi

  DBNAME=$(aws secretsmanager get-secret-value --secret-id "${SECRET_NAME}" --query "SecretString" --output text | jq -r ".dbname")
  USERNAME=$(aws secretsmanager get-secret-value --secret-id "${SECRET_NAME}" --query "SecretString" --output text | jq -r ".username")
  PGPASSWORD=$(aws secretsmanager get-secret-value --secret-id "${SECRET_NAME}" --query "SecretString" --output text | jq -r ".password")
  export PGPASSWORD

  trap stop_db_tunnel EXIT
  psql --set=sslmode=verify-ca -h 127.0.0.1 -p ${SSH_TUNNEL_PORT} -U "${USERNAME}" -d "${DBNAME}" "$@"
}

function require_reaktor_vpn {
  if [ "62.165.154.10" != $(curl --silent "https://checkip.amazonaws.com") ]; then
    fatal "Reaktor VPN required, aborting";
  fi
}

main "$@"
