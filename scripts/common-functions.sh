#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

readonly repo="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )"
readonly node_version="18.9.1"
readonly ansible_version="4.6.0"
readonly python_version="3.9.0"
readonly local_docker_namespace="va"

function remove_all_files_ignored_or_untracked_by_git {
  git clean -xdf
}

function install_docker_compose {
  echo "Installing docker compose"
  pushd "$repo/scripts"
  curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o ./docker-compose
  chmod u+x ./docker-compose
  ./docker-compose --version
  popd
}

function parse_env_from_script_name {
  local BASE_FILENAME="$1"
  FILE_NAME=$(basename "$0")
  if echo "${FILE_NAME}" | grep -E -q "$BASE_FILENAME-.([^-]+)\.sh"; then
    ENV=$(echo "${FILE_NAME}" | sed -E -e "s|$BASE_FILENAME-([^-]+)\.sh|\1|g")
    export ENV
    echo "Targeting environment [${ENV}]"
  else
    echo >&2 "Don't call this script directly"
    exit 1
  fi
}


function running_on_jenkins {
  [ "${JENKINS_HOME:-}" != "" ]
}

function init_nodejs {
  export NVM_DIR="${NVM_DIR:-$HOME/.cache/nvm}"
  set +o errexit
  source "$repo/nvm.sh"
  nvm use "${node_version}" || nvm install "${node_version}"
  set -o errexit
}

function npm_ci_if_package_lock_has_changed {
  info "Checking if npm ci needs to be run"
  require_command shasum
  local -r checksum_file=".package-lock.json.checksum"

  function run_npm_ci {
    npm ci
    shasum package-lock.json > "$checksum_file"
  }

  if [ ! -f "$checksum_file" ]; then
    echo "new package-lock.json; running npm ci"
    run_npm_ci
  elif ! shasum --check "$checksum_file"; then
    info "package-lock.json seems to have changed, running npm ci"
    run_npm_ci
  else
    info "package-lock.json doesn't seem to have changed, skipping npm ci"
  fi
}

function wait_until_port_is_listening {
  require_command nc
  local -r port="$1"

  info "Waiting until port $port is listening"
  while ! nc -z localhost "$port"; do
    sleep 1
  done
}

function require_docker {
  require_command docker
  docker ps > /dev/null 2>&1 || { echo >&2 "Running 'docker ps' failed. Is docker daemon running? Aborting."; exit 1; }
}

function wait_for_container_to_be_healthy {
  require_command docker
  local -r container_name="$1"

  info "Waiting for docker container $container_name to be healthy"
  until [ "$(docker inspect -f {{.State.Health.Status}} "$container_name" 2>/dev/null || echo "not-running")" == "healthy" ]; do
    sleep 2;
  done;
}

function require_command {
  if ! command -v "$1" > /dev/null; then
    fatal "I require $1 but it's not installed. Aborting."
  fi
}

function info {
  log "INFO" "$1"
}

function fatal {
  log "ERROR" "$1"
  exit 1
}

function log {
  local -r level="$1"
  local -r message="$2"
  local -r timestamp=$(date +"%Y-%m-%d %H:%M:%S")

  >&2 echo -e "${timestamp} ${level} ${message}"
}
