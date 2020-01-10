#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

function check_requirements {
  if ! [[ -x "$(command -v curl)" ]]; then
    echo "Curl is required, cannot continue"
    exit 1
  fi
}

function waitport {
  i=0
  PORT=$1
  MAX_WAIT=${2:-10}

  while ! curl -s "http://localhost:${PORT}/" > /dev/null; do
    echo "Waiting for port ${PORT} to respond, ${i}/${MAX_WAIT}"

    if [[ $i -gt ${MAX_WAIT} ]]; then
      echo "Port not responding and max time exceeded, exiting..."
      exit 1
    fi

    sleep 1
    ((i=i+1))
  done

  echo "Port ${PORT} is responding"
}

function main {

  check_requirements
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
