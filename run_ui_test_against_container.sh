#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

function main {

  VA_SECRET_CONF_FILE=${VA_SECRET_CONF_FILE:-"../valtionavustus-secret/config/secret-dev.edn"}

  cp ${VA_SECRET_CONF_FILE} ./secret-dev.edn
  docker build -t "va-virkailija:latest" -f ./Dockerfile.virkailija ./
  rm ./secret-dev.edn

  docker build -t "va-hakija:latest" -f ./Dockerfile.hakija ./
  docker build -t "va-ui-test:latest" -f ./Dockerfile.ui_test ./

  trap 'docker-compose -f ./docker-compose-ui-test.yml down' EXIT

  docker-compose -f ./docker-compose-ui-test.yml up --abort-on-container-exit

  #waitport 8080 200
  #waitport 8081 200

  #export HEADLESS=true
  #./run_ui_test.sh
}

main "$@"
