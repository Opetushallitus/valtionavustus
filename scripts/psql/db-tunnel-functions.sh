#!/usr/bin/env bash
# Shared functions for connecting to remote VA databases via SSH tunnel.
# Sourced by psql-va.sh, pg_dump-va.sh, pull-va-data.sh, etc.

SSH_TUNNEL_PORT=40077

function start_db_tunnel {
  docker-compose -f "${repo}/scripts/psql/docker-compose.yml" up --build --detach --wait || {
    docker-compose -f "${repo}/scripts/psql/docker-compose.yml" logs && exit 1
  }
  wait_until_port_is_listening "${SSH_TUNNEL_PORT}"
  docker-compose logs
}

function stop_db_tunnel {
  docker-compose -f "${repo}/scripts/psql/docker-compose.yml" down
}

function fetch_db_credentials {
  local SECRET_NAME="/db/databaseSecrets"
  DBNAME=$(aws secretsmanager get-secret-value --secret-id "${SECRET_NAME}" --query "SecretString" --output text | jq -r ".dbname")
  USERNAME=$(aws secretsmanager get-secret-value --secret-id "${SECRET_NAME}" --query "SecretString" --output text | jq -r ".username")
  PGPASSWORD=$(aws secretsmanager get-secret-value --secret-id "${SECRET_NAME}" --query "SecretString" --output text | jq -r ".password")
  export PGPASSWORD
}
