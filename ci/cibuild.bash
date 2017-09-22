#!/usr/bin/env bash

set -euo pipefail

function cd_project_root_dir() {
  local script_dir=$(dirname "$0")
  cd "$script_dir/.." || exit 3
}

cd_project_root_dir

function show_usage() {
  cat << EOF
Usage: ${0##*/} [-d] [-p <docker_postgres_port] [-r] [clean] [build] [test] [deploy] [deploy_jar -m <module> -s <target_server_name> [-j <source_jar_path>]]

  -d  Disables running PostgreSQL in Docker container
  -p  The host port to which Docker binds PostgreSQL; should be the same as in the app config
  -r  Recreate database when deploying (default: false)
  -m  The module to deploy: va-hakija or va-virkailija
  -s  Target server hostname
  -j  Source jar path
EOF
  exit 2
}

run_docker_postgresql=true
recreate_database=false
va_hakija_default_source_path="va-hakija/target/uberjar/hakija-*-standalone.jar"
va_virkailija_default_source_path="va-virkailija/target/uberjar/virkailija-*-standalone.jar"

function clean() {
  time make clean
}

function add_git_head_snippets() {
  echo "Adding git head snippets..."
  for m in va-hakija va-virkailija; do
    pushd "$m"
    git show --pretty=short --abbrev-commit -s HEAD > resources/public/git-HEAD.txt
    popd
  done
}

function build() {
  add_git_head_snippets
  time make build
}

function start_postgresql_in_docker() {
  start_postgresql_in_container
  wait_for_postgresql_to_be_available
  # give_schema_to_va hakija  # When using our own schema that is owned by va, we don't need to give it access
  create_va_virkailija_user
}

function run_tests() {
  if [ "$run_docker_postgresql" = true ]; then
    start_postgresql_in_docker
  fi

  local tests_exit_code
  tests_exit_code=0

  time make test \
    MOCHA_ARGS="--reporter mocha-junit-reporter" \
    MOCHA_FILE="target/junit-mocha-js-unit.xml" \
    SPECLJ_ARGS="-f junit" \
    || tests_exit_code=$?

  if [ "$run_docker_postgresql" = true ]; then
    remove_postgresql_container
  fi

  if [ $tests_exit_code -ne 0 ]; then
    echo "Tests failed: $tests_exit_code"
    exit $tests_exit_code
  fi
}

function drop_database() {
  echo "Dropping database..."
  $SSH "sudo -u postgres /usr/local/bin/run_sql.bash ${CURRENT_DIR}/va-hakija/resources/sql/drop_schema.sql -v schema_name=hakija"
}

function restart_application() {
  module_name=$1
  echo "Stopping application..."
  if [ "$target_server_name" = "va-dev" ] || [[ "$target_server_name" == *".csc.fi" ]]; then
    $SSH "supervisorctl stop $module_name"
  else
    $SSH "sudo /usr/local/bin/va_app.bash --stop $module_name"
  fi
  if [ "$recreate_database" = true ]; then
    drop_database
  else
    echo "Not dropping existing database."
  fi
  if [ "$target_server_name" = "va-dev" ] || [[ "$target_server_name" == *".csc.fi" ]]; then
    APP_COMMAND="supervisorctl start $module_name"
  else
    APP_COMMAND="sudo /usr/local/bin/va_app.bash --start $module_name ${CURRENT_DIR}/${module_name}.jar file:${CURRENT_DIR}/resources/log4j-deployed.properties ${CURRENT_DIR}/config/defaults.edn ${CURRENT_DIR}/config/${target_server_name}.edn"
  fi
  echo "Starting application (${APP_COMMAND}) ..."
  $SSH "${APP_COMMAND}"
}

function do_deploy_jar() {
  if [[ -z $target_server_name ]]; then
    echo "deploy: Please provide target server name with -s option."
    exit 4
  fi
  module_name=$1
  if [ -z ${jar_to_deploy_source_path+x} ]; then
    jar_source_path=$2
  else
    jar_source_path=${jar_to_deploy_source_path}
  fi
  application_port=$3
  echo "Starting $module_name..."
  echo "Transfering to application server ${target_server_name} ..."
  SSH_KEY=~/.ssh/id_deploy
  SSH_USER=va-deploy
  SSH="ssh -i $SSH_KEY va-deploy@${target_server_name}"
  BASE_DIR=/data/www
  CURRENT_DIR=${BASE_DIR}/${module_name}-current
  TARGET_DIR=${BASE_DIR}/${module_name}-`date +'%Y%m%d%H%M%S'`
  TARGET_JAR_PATH=${TARGET_DIR}/${module_name}.jar
  echo "Copying artifacts to ${target_server_name}:${TARGET_DIR} ..."
  $SSH "mkdir -p ${TARGET_DIR}"
  scp -p -i ${SSH_KEY} ${jar_source_path} ${SSH_USER}@"${target_server_name}":${TARGET_JAR_PATH}
  scp -pr -i ${SSH_KEY} ${module_name}/config ${module_name}/resources ${SSH_USER}@"${target_server_name}":${TARGET_DIR}
  $SSH ln -sfT ${TARGET_DIR} ${CURRENT_DIR}
  restart_application ${module_name}
  CAT_LOG_COMMAND="$SSH tail -n 100 /logs/valtionavustus/${module_name}_run.log /logs/valtionavustus/${module_name}_application.log"
  HEALTH_CHECK_COMMAND="`dirname $0`/health_check.bash ${SSH_USER} ${SSH_KEY} ${target_server_name} ${application_port} $CAT_LOG_COMMAND"
  echo "Checking that application responds to healthcheck ($HEALTH_CHECK_COMMAND)..."
  $HEALTH_CHECK_COMMAND
  echo "Success in starting $module_name"
}

function deploy_hakija() {
  do_deploy_jar va-hakija ${va_hakija_default_source_path} 8081
}

function deploy_virkailija() {
  do_deploy_jar va-virkailija ${va_virkailija_default_source_path} 6071
}

function deploy_jar() {
  if [ -z ${module_to_deploy+x} ]; then
    echo "deploy_jar: Please provide module name with -m option."
    show_usage
    exit 5
  fi
  if [ "$module_to_deploy" = "va-hakija" ]; then
    deploy_hakija
  elif [ "$module_to_deploy" = "va-virkailija" ]; then
    deploy_virkailija
  else
    echo "deploy_jar: unknown module_name \"$module_to_deploy\"."
    show_usage
    exit 6
  fi
}

function deploy() {
  deploy_hakija
  deploy_virkailija
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
      build)
      commands+=('build')
      ;;
      test)
      commands+=('run_tests')
      ;;
      deploy)
      commands+=('deploy')
      ;;
      deploy_jar)
      commands+=('deploy_jar')
      ;;
      -s|--target-server-name)
      target_server_name="$2"
      shift # past argument
      ;;
      -p|--postgresql-port-for-host)
      host_postgres_port="$2"
      shift # past argument
      ;;
      -d|--disable-container-postgresql)
      run_docker_postgresql=false
      ;;
      -r|--recreate-database)
      recreate_database=true
      ;;
      -j|--source-jar-path)
      jar_to_deploy_source_path="$2"
      shift # past argument
      ;;
      -m|--module-to-deploy)
      module_to_deploy="$2"
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
    printf "\n**** ${commands[$i]} *****\n\n"
    eval "${commands[$i]}"
done
