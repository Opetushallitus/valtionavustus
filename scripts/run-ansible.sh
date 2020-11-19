#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

readonly SSH_KEY_PATH="$HOME/.ssh/oph-valtionavustus"

function main {
  info "Running ansible against $ENV environment"

  require_command pyenv
  require_command gpg

  if [ ! -f "$SSH_KEY_PATH" ]; then
    fatal "Expected '$SSH_KEY_PATH' to exists"
  fi

  # Python 2.7 workaround for error "ValueError: unknown locale: UTF-8"
  export LC_ALL=en_US.UTF-8
  export LANG=en_US.UTF-8

  use_python_version "2.7.18"
  install_python_dependencies

  run_ansible
}

function run_ansible {
  if [ "$ENV" = "qa" ]; then
    local -r ansible_hosts="va_app_qa"
  elif [ "$ENV" = "prod" ]; then
    local -r ansible_hosts="va_app_prod"
  elif [ "$ENV" = "loadbalancer" ]; then
    local -r ansible_hosts="va_loadbalancer"
  elif [ "$ENV" = "jenkins" ]; then
    local -r ansible_hosts="va_build"
  else
    fatal "Invalid environment $ENV"
  fi

  pushd "$repo/servers"
  ansible-playbook \
    --limit "$ansible_hosts" \
    site.yml
  popd
}

function use_python_version {
  local -r python_version="$1"

  info "Installing python version $python_version"

  pushd "$repo"
  eval "$(pyenv init -)"
  pyenv install --skip-existing "$python_version"
  pyenv local "$python_version"
  popd
}

function install_python_dependencies {
  info "installing Python dependencies"

  pushd "$repo/servers"
  pip install pipenv==2020.11.15
  python -m pipenv install > /dev/null
  source "$(python -m pipenv --venv)/bin/activate"
  popd
}

function check_env {
  FILE_NAME=$(basename "$0")
  if echo "${FILE_NAME}" | grep -E -q '.*-[^-]+\.sh$'; then
    ENV=$(echo "${FILE_NAME}" | sed -E -e 's|.*-([^-]+)\.sh$|\1|g')
    export ENV
  else
    fatal "Don't call this script directly"
  fi
}

if [ "${JENKINS_HOME:-}" != "" ]; then
  docker image prune --force
  remove_all_files_ignored_by_git
fi
check_env
main "$@"
