#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

function main {

  docker build -t "va-virkailija:latest" -f ./Dockerfile.virkailija ./
  docker build -t "va-hakija:latest" -f ./Dockerfile.hakija ./
  docker build -t "va-ui-test:latest" -f ./Dockerfile.ui_test ./
  
  docker-compose -f ./docker-compose-ui-test.yml up --abort-on-container-exit
}

main "$@"
