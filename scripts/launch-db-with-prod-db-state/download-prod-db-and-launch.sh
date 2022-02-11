#!/bin/bash

function download_db_dump_from_lampi() {
  echo "Downloading VA DB dump from Lampi"
  AWS_PROFILE="oph-datalake-prod" aws s3 cp s3://oph-lampi-prod/fulldump/valtionavustukset/v1/valtionavustukset.backup ./valtionavustukset.backup
}

function start-db() {
  echo "Starting DB"
  docker-compose -f ./prod-db-docker-compose.yml up
}

function main() {
  if [ ! -f "./valtionavustukset.backup" ]; then
    download_db_dump_from_lampi
  else
    echo "Dump file already exists, not downloading again"
  fi

  start-db
}

main
