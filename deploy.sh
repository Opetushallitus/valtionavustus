#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
repo="$( cd "$( dirname "$0" )" && pwd )"

function main {
  init_nodejs
  set_env_vars

  "$repo/ci/jenkins-cibuild.bash" no-server clean build test

  ls "$repo"/va-hakija/target/*uberjar*/hakija-*-standalone.jar
  ls "$repo"/va-virkailija/target/*uberjar*/virkailija-*-standalone.jar

  "$repo/ci/deploy_jar.bash" $APP_HOSTNAME.csc.fi va-hakija "$repo"/va-hakija/target/*uberjar*/hakija-*-standalone.jar
  "$repo/ci/deploy_jar.bash" $APP_HOSTNAME.csc.fi va-virkailija "$repo"/va-virkailija/target/*uberjar*/virkailija-*-standalone.jar
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
  nvm use 8.16.1 || nvm install 8.16.1
  if [ "$(npm --version)" != "6.10.2" ]; then
    npm install -g npm@6.10.2
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

remove_all_files_ignored_by_git
check_env
main "$@"
