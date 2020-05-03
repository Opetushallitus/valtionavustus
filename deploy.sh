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

  ls "$repo"/va-hakija/target/*uberjar*/hakija-*-standalone.jar
  ls "$repo"/va-virkailija/target/*uberjar*/virkailija-*-standalone.jar

  "$repo/ci/deploy_jar.bash" $APP_HOSTNAME.csc.fi va-hakija "$repo"/va-hakija/target/*uberjar*/hakija-*-standalone.jar
  "$repo/ci/deploy_jar.bash" $APP_HOSTNAME.csc.fi va-virkailija "$repo"/va-virkailija/target/*uberjar*/virkailija-*-standalone.jar
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
