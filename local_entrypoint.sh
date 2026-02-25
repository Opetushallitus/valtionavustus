#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

function setup_known_hosts() {
  [[ -z "${PAYMENT_SERVICE_HOST:-}" ]] && { echo "PAYMENT_SERVICE_HOST must be set, cannot continue" ; exit 1; }
  [[ -z "${PAYMENT_SERVICE_HOST_KEY:-}" ]] && { echo "PAYMENT_SERVICE_HOST_KEY must be set, cannot continue" ; exit 1; }

  echo "Populating known_hosts file from environment variables"
  mkdir -p ~/.ssh
  echo "${PAYMENT_SERVICE_HOST} ${PAYMENT_SERVICE_HOST_KEY}" >> ~/.ssh/known_hosts
}

setup_known_hosts
./lein with-profile +server-local run -m oph.va.hakija.main
