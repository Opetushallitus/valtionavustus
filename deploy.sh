#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

trap stop_systems_under_test EXIT

function current-commit-is-not-tested {
  ! git tag --contains | grep -q "green-qa"
}

function main {
  if running_on_jenkins; then
    docker image prune --force
    docker volume prune --force
    remove_all_files_ignored_or_untracked_by_git
    install_docker_compose
  fi
  parse_env_from_script_name "deploy"
  check_requirements
  init_nodejs
  set_env_vars
  make_clean
  make_build
  if current-commit-is-not-tested;
  then
    npm run prettier-check-project
    if running_on_jenkins; then
      docker-compose -f ${PLAYWRIGHT_COMPOSE_FILE} up --abort-on-container-exit
    fi
    start_system_under_test ${DOCKER_COMPOSE_FILE}
    run_tests
    stop_system_under_test ${DOCKER_COMPOSE_FILE}
  fi
  deploy_jars
}

valtionavustus_jar="$repo"/target/*uberjar*/valtionavustus-*-standalone.jar
function deploy_jars {
  ls ${valtionavustus_jar}

  do_deploy_jar $APP_HOSTNAME.csc.fi va-hakija ${valtionavustus_jar} 8081
  do_deploy_jar $APP_HOSTNAME.csc.fi va-virkailija ${valtionavustus_jar} 6071
}

function do_deploy_jar {
  local target_server_name=$1
  local module_name=$2
  local jar_source_path=$3
  local application_port=$4
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
  scp -pr -i ${SSH_KEY} ${module_name}/config ${SSH_USER}@"${target_server_name}":${TARGET_DIR}
  $SSH ln -sfT ${TARGET_DIR} ${CURRENT_DIR}
  restart_application ${module_name}
  CAT_LOG_COMMAND="$SSH tail -n 100 /logs/valtionavustus/${module_name}_run.log /logs/valtionavustus/${module_name}_application.log"
  HEALTH_CHECK_COMMAND="`dirname $0`/ci/health_check.bash ${SSH_USER} ${SSH_KEY} ${target_server_name} ${application_port} $CAT_LOG_COMMAND"
  echo "Checking that application responds to healthcheck ($HEALTH_CHECK_COMMAND)..."
  $HEALTH_CHECK_COMMAND
  echo "Success in starting $module_name"
  echo "Removing old artifcats"
  $SSH "find ${BASE_DIR} -maxdepth 1 -type d -name \"*${module_name}*\" -not -path ${TARGET_DIR} -exec rm -r {} \;"
  echo "Finished removing old artifacts"
}

function restart_application {
  local module_name=$1
  echo "Stopping application..."
  $SSH "supervisorctl stop $module_name"
  echo "Starting application..."
  $SSH "supervisorctl start $module_name"
}

function set_env_vars {
  export JAVA_HOME
  if [ "$ENV" = "qa" ]; then
    export APP_HOSTNAME="oph-va-app-test01"
  elif [ "$ENV" = "prod" ]; then
    export APP_HOSTNAME="oph-va-app-prod01"
  else
    echo "Invalid environment $ENV" >&2
    exit 1
  fi
}

main "$@"
