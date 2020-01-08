#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

cp ../valtionavustus-secret/config/secret-dev.edn ./secret-dev.edn
#docker build -t "va-virkailija:latest" -f ./Dockerfile.virkailija ./
rm ./secret-dev.edn

#docker build -t "va-hakija:latest" -f ./Dockerfile.hakija ./

docker build -t "va-ui-test:latest" -f ./Dockerfile.ui_test ./

docker-compose -f ./docker-compose-ui-test.yml up --abort-on-container-exit

./run_ui_test.sh

docker-compose -f ./docker-compose-ui-test.yml down

