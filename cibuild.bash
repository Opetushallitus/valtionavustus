#!/bin/bash
set -euo pipefail

function show_usage() {
cat << EOF
  Usage: ${0##*/} [clean] [uberjar] [test] [-p <docker postgresql port>] [deploy] [-s <target server name> ]
EOF
  exit 2
}


function clean() {
  node_modules_location=node_modules
  echo "Running lein clean and emptying $node_modules_location"
  ./lein clean
  rm -rf $node_modules_location
}

function uberjar() {
  time ./lein uberjar
}

function start_postgresql_in_docker() {
  echo "=============================="
  echo
  echo "Starting Postgresql in Docker"
  start_postgresql_in_container
  wait_for_postgresql_to_be_available
  give_public_schema_to_va
}

function run_tests() {
  start_postgresql_in_docker
  time ./lein spec -f junit || true

  remove_postgresql_container
}

function deploy() {
  if [ -z ${target_server_name+x} ]; then
    echo "deploy: Please provide target server name with -s option."
    exit 4
  fi
  echo "=============================="
  echo
  echo "Transfering to test server ${target_server_name}"
  SSH_KEY=~/.ssh/id_deploy
  SSH_USER=va-deploy
  SSH="ssh -i $SSH_KEY va-deploy@${target_server_name}"
  BASE_DIR=/data/www
  CURRENT_DIR=${BASE_DIR}/current
  TARGET_DIR=${BASE_DIR}/va-`date +'%Y%m%d%H%M%S'`
  TARGET_JAR_PATH=${TARGET_DIR}/va.jar
  echo "=============================="
  echo
  echo "...copying artifcats to ${target_server_name}:${TARGET_DIR} ..."
  $SSH "mkdir -p ${TARGET_DIR}"
  scp -p -i ${SSH_KEY} target/uberjar/oph-valtionavustus-*-standalone.jar ${SSH_USER}@"${target_server_name}":${TARGET_JAR_PATH}
  scp -pr -i ${SSH_KEY} config resources ${SSH_USER}@"${target_server_name}":${TARGET_DIR}
  $SSH ln -sfT ${TARGET_DIR} ${CURRENT_DIR}
  echo "=============================="
  echo
  echo "Stopping application..."
  $SSH "sudo /usr/local/bin/stop_app.bash"
  echo "=============================="
  echo
  echo "...dropping db.."
  $SSH "sudo -u postgres /usr/local/bin/run_sql.bash ${CURRENT_DIR}/resources/sql/drop_public_schema.sql"
  APP_COMMAND="sudo /usr/local/bin/run_app.bash ${CURRENT_DIR}/va.jar ${CURRENT_DIR}/config/defaults.edn ${CURRENT_DIR}/config/test.edn"
  echo "=============================="
  echo
  echo "...starting application with command \"${APP_COMMAND}\" ..."
  $SSH "${APP_COMMAND}"
  HEALTH_CHECK_COMMAND="/usr/local/bin/health_check.bash"
  echo "=============================="
  echo
  echo "...checking that it really comes up, with $HEALTH_CHECK_COMMAND ..."
  $HEALTH_CHECK_COMMAND
  echo
  echo "=============================="
  echo
  echo "...start done!"
}


if [ "$#" -lt 1 ]; then
    show_usage
fi

commands=()
while [[ $# > 0 ]]; do
  key="$1"

  case $key in
      clean)
      commands+=('clean')
      ;;
      uberjar)
      commands+=('uberjar')
      ;;
      test)
      commands+=('run_tests')
      ;;
      deploy)
      commands+=('deploy')
      ;;
      -s|--target-server-name)
      target_server_name="$2"
      shift # past argument
      ;;
      -p|--postgresql-port-for-host)
      host_postgres_port="$2"
      shift # past argument
      ;;
      *)
      # unknown option
      show_usage
      ;;
  esac
  shift # past command or argument value
done

source `dirname $0`/postgresql_container_functions.bash

for (( i = 0; i < ${#commands[@]} ; i++ )); do
    printf "\n**** Running: ${commands[$i]} *****\n\n"
    eval "${commands[$i]}"
done