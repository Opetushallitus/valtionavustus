#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

HAKIJA_HOSTNAME=${HAKIJA_HOSTNAME:-"localhost"}
VIRKAILIJA_HOSTNAME=${VIRKAILIJA_HOSTNAME:-"localhost"}
DOCKER_COMPOSE_FILE=./docker-compose-test.yml
PLAYWRIGHT_COMPOSE_FILE=./docker-compose-playwright-test.yml

function current-commit-is-not-tested {
  ! git tag --contains | grep -q "green-qa"
}

function fix_directory_permissions_after_playwright_run {
  echo "Fixing directory permissions after Playwright run"

  set +e
  JENKINS_ID="$(id -u jenkins)"
  JENKINS_GID="$(id -g jenkins)"

  docker run \
    --env JENKINS_ID=${JENKINS_ID} \
    --env JENKINS_GID=${JENKINS_GID} \
    --rm \
    -v ${PWD}/playwright-results:/playwright-results bash:latest bash -c "chown -R ${JENKINS_ID}:${JENKINS_GID} /playwright-results"

  set -e
}

function main {
  if running_on_jenkins; then
    docker image prune --force
    docker volume prune --force
    remove_all_files_ignored_or_untracked_by_git
  fi
  parse_env_from_script_name "deploy"
  check_requirements
  init_nodejs
  install_docker_compose
  set_env_vars
  clean
  build
  if current-commit-is-not-tested;
  then
    npm run prettier-check-project
    build_docker_images
    if running_on_jenkins; then
      scripts/docker-compose -f ${PLAYWRIGHT_COMPOSE_FILE} up --abort-on-container-exit
    fi
    start_system_under_test ${DOCKER_COMPOSE_FILE}
    run_tests
    stop_system_under_test ${DOCKER_COMPOSE_FILE}
  fi
  deploy_jars
}

function stop_systems_under_test  {
  echo "Stopping all systems under test"
  fix_directory_permissions_after_playwright_run
  stop_system_under_test ${DOCKER_COMPOSE_FILE}
  stop_system_under_test ${PLAYWRIGHT_COMPOSE_FILE}
}

function stop_system_under_test () {
  echo "Stopping system under test"
  scripts/docker-compose -f "$1" down --remove-orphans
}
trap stop_systems_under_test EXIT

function build_docker_images {
  docker build -t "rcs-fakesmtp:latest" -f ./Dockerfile.rcs-fakesmtp ./
  docker build -t "va-virkailija:latest" -f ./Dockerfile.virkailija ./
  docker build -t "va-hakija:latest" -f ./Dockerfile.hakija ./
  docker build -t "playwright-test-runner:latest" -f ./Dockerfile.playwright-test-runner ./
}

function start_system_under_test () {
  echo "Starting system under test"

  scripts/docker-compose -f "$1" up -d hakija
  wait_for_container_to_be_healthy va-hakija

  scripts/docker-compose -f "$1" up -d virkailija
  wait_for_container_to_be_healthy va-virkailija

  # Make sure all services are running and follow their logs
  scripts/docker-compose -f "$1" up -d
  scripts/docker-compose -f "$1" logs --follow &
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
  export PLAYWRIGHT_WORKERS=6
  export MOCHA_ARGS="--reporter mocha-junit-reporter"
  export MOCHA_FILE="target/junit-mocha-js-unit.xml"
  export SPECLJ_ARGS="-f junit"

  ./run_isolated_system_tests.sh
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
  scp -pr -i ${SSH_KEY} ${module_name}/config ${module_name}/resources ${SSH_USER}@"${target_server_name}":${TARGET_DIR}
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
