#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
node_version="12.13.1"
npm_version="6.13.4"
repo="$( cd "$( dirname "$0" )" && pwd )"

function main {
  init_nodejs
  set_env_vars
  clean
  build
  run_tests
  deploy_jars
}

clean() {
  time make clean
}

build() {
  add_git_head_snippets
  time make build
}

add_git_head_snippets() {
  echo "Adding git head snippets..."
  for m in va-hakija va-virkailija; do
    pushd "$m"
    git show --pretty=short --abbrev-commit -s HEAD > resources/public/git-HEAD.txt
    popd
  done
}

run_tests() {
  echo "Running isolated system tests"
  export HEADLESS=true
  export MOCHA_ARGS="--reporter mocha-junit-reporter"
  export MOCHA_FILE="target/junit-mocha-js-unit.xml"
  export SPECLJ_ARGS="-f junit"

  ./run_isolated_system_tests.sh
}

va_hakija_jar="$repo"/va-hakija/target/*uberjar*/hakija-*-standalone.jar
va_virkailija_jar="$repo"/va-virkailija/target/*uberjar*/virkailija-*-standalone.jar
function deploy_jars {
  ls ${va_hakija_jar}
  ls ${va_virkailija_jar}

  do_deploy_jar $APP_HOSTNAME.csc.fi va-hakija ${va_hakija_jar} 8081
  do_deploy_jar $APP_HOSTNAME.csc.fi va-virkailija ${va_virkailija_jar} 6071
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
  scp -pr -i ${SSH_KEY} ${module_name}/config ${module_name}/resources ${SSH_USER}@"${target_server_name}":${TARGET_DIR}
  $SSH ln -sfT ${TARGET_DIR} ${CURRENT_DIR}
  restart_application ${module_name}
  CAT_LOG_COMMAND="$SSH tail -n 100 /logs/valtionavustus/${module_name}_run.log /logs/valtionavustus/${module_name}_application.log"
  HEALTH_CHECK_COMMAND="`dirname $0`/health_check.bash ${SSH_USER} ${SSH_KEY} ${target_server_name} ${application_port} $CAT_LOG_COMMAND"
  echo "Checking that application responds to healthcheck ($HEALTH_CHECK_COMMAND)..."
  $HEALTH_CHECK_COMMAND
  echo "Success in starting $module_name"
}

function restart_application {
  local module_name=$1
  echo "Stopping application..."
  $SSH "supervisorctl stop $module_name"
  echo "Starting application..."
  $SSH "supervisorctl start $module_name"
}

function remove_all_files_ignored_by_git {
  git clean -xdf
}

function set_env_vars {
  if [ "$ENV" = "qa" ]; then
    export APP_HOSTNAME="oph-va-app-test01"
  elif [ "$ENV" = "prod" ]; then
    export APP_HOSTNAME="oph-va-app-prod01"
  else
    echo "Invalid environment $ENV" >&2
    exit 1
  fi
}

function init_nodejs {
  export NVM_DIR="${NVM_DIR:-$HOME/.cache/nvm}"
  source "$repo/nvm.sh"
  nvm use "$node_version" || nvm install "$node_version"
  if [ "$(npm --version)" != "$npm_version" ]; then
    npm install -g "npm@${npm_version}"
  fi
}

function check_env {
  FILE_NAME=$(basename "$0")
  if echo "${FILE_NAME}" | grep -E -q 'deploy-.{2,4}\.sh'; then
    ENV=$(echo "${FILE_NAME}" | sed -E -e 's|deploy-(.{2,4})\.sh|\1|g')
    export ENV
    echo "Deploying to [${ENV}]"
  else
    echo >&2 "Don't call this script directly"
    exit 1
  fi
}

if [ "${JENKINS_HOME:-}" != "" ]; then
  docker image prune --force
  remove_all_files_ignored_by_git
fi
check_env
main "$@"
