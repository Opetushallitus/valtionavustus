#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"
# shellcheck source=deploy-scripts/jenkins-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/deploy-scripts/jenkins-functions.sh"

trap stop_systems_under_test EXIT

valtionavustus_jar="$repo"/target/*uberjar*/valtionavustus-*-standalone.jar
function main {
  if running_on_jenkins; then
    docker image prune --force
    docker volume prune --force
    remove_all_files_ignored_or_untracked_by_git
    install_docker_compose
  fi
  parse_env_from_script_name "deploy"
  set_env_vars
  build_and_test_jars

  ls ${valtionavustus_jar}
  do_deploy_jar
}

function do_deploy_jar {
  local target_server_name=$APP_HOSTNAME.csc.fi
  local module_name=va
  local jar_source_path=${valtionavustus_jar}
  local virkailija_port=6071
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
  scp -pr -i ${SSH_KEY} ${module_name}-hakija/config ${SSH_USER}@"${target_server_name}":${TARGET_DIR}
  $SSH ln -sfT ${TARGET_DIR} ${CURRENT_DIR}
  restart_application
  run_smoke_test
  cat_latest_application_log
  echo "Success in starting $module_name"
  echo "Removing old artifcats"
  $SSH "find ${BASE_DIR} -maxdepth 1 -type d -name \"*${module_name}*\" -not -path ${TARGET_DIR} -exec rm -r {} \;"
  echo "Finished removing old artifacts"
}

function cat_latest_application_log() {
  cat_log_command="$SSH tail -n 100 /logs/valtionavustus/${module_name}_run.log /logs/valtionavustus/${module_name}_application.log"

  echo
  echo "*** Latest application log (by $cat_log_command ): ***"
  eval $cat_log_command
  echo "*** /Latest application log ends *********************"
  echo
}

function run_smoke_test {
  echo "Running smoke tests"
  local -r test_command="npm run playwright:smoketest-${ENV}"

  if running_on_jenkins || running_on_gh_actions; then
    docker-compose -f "${DOCKER_COMPOSE_FILE}" run -e REVISION=${revision} --entrypoint="${test_command}" test-runner --no-deps
  else
    eval "REVISION=${revision} ${test_command}"
  fi
}

function restart_application {
  echo "Stopping application..."
  $SSH "supervisorctl stop va"
  echo "Starting application..."
  $SSH "supervisorctl start va"
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
