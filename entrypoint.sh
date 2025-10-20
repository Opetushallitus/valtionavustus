#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

function setup_known_hosts() {
  [[ -z "${PAYMENT_SERVICE_HOST:-}" ]] && { echo "MAKSATUSPALVELU_HOST_IP must be set, cannot continue" ; exit 1; }
  [[ -z "${PAYMENT_SERVICE_HOST_KEY:-}" ]] && { echo "MAKSATUSPALVELU_HOST_KEY must be set, cannot continue" ; exit 1; }

  echo "Populating known_hosts file from environment variables"
  mkdir -p ~/.ssh
  echo "${PAYMENT_SERVICE_HOST} ${PAYMENT_SERVICE_HOST_KEY}" >> ~/.ssh/known_hosts
}

function start_valtionavustukset_server() {
  exec java -jar /app/valtionavustus.jar "$@"
}

function main() {
  setup_known_hosts
  start_valtionavustukset_server "$@"
}

main "$@"
