#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
repo="$( cd "$( dirname "$0" )" && pwd )"

HAKIJA_HOSTNAME=${HAKIJA_HOSTNAME:-"localhost"}
VIRKAILIJA_HOSTNAME=${VIRKAILIJA_HOSTNAME:-"localhost"}
DOCKER_COMPOSE_FILE=./docker-compose-test.yml

function stop_system_under_test {
  echo "Stopping system under test"
  docker-compose -f ${DOCKER_COMPOSE_FILE} down --remove-orphans
}
trap stop_system_under_test EXIT

function start_system_under_test {
  echo "Starting system under test"
  docker build -t "va-virkailija:latest" -f ./Dockerfile.virkailija ./
  docker build -t "va-hakija:latest" -f ./Dockerfile.hakija ./

  docker-compose -f ${DOCKER_COMPOSE_FILE} up -d
}

function check_requirements {
  if ! [[ -x "$(command -v curl)" ]]; then
    echo "Curl is required, cannot continue"
    exit 1
  fi
}

function waitport {
  i=0
  HOSTNAME=$1
  PORT=$2
  MAX_WAIT=${3:-100}

  while ! curl -s "http://${HOSTNAME}:${PORT}/" > /dev/null; do
    echo "Waiting for port ${PORT} to respond on host ${HOSTNAME}, ${i}/${MAX_WAIT}"

    if [[ $i -gt ${MAX_WAIT} ]]; then
      echo "Port not responding and max time exceeded, exiting..."
      exit 1
    fi

    sleep 1
    ((i=i+1))
  done

  echo "Port ${PORT} is responding on host ${HOSTNAME}"
}

function main {
  check_requirements

  export ADBLOCK=1
  cd "$repo"
  . ./init_nodejs.sh
  npm install

  start_system_under_test
  waitport ${HAKIJA_HOSTNAME} 8080 150
  waitport ${VIRKAILIJA_HOSTNAME} 8081 150

  npx mocha ${MOCHA_ARGS} "test/**/*Spec.js"
  make clean build test
}

main "$@"
