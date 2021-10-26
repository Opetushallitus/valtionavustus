#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

readonly PYTHON_VERSION="3.9.0"
readonly SSH_KEY_PATH="$HOME/.ssh/oph-valtionavustus"
readonly VA_SECRETS_REPO="$repo/../valtionavustus-secret"

function main {
  info "Running ansible against $ENV environment"

  require_command pyenv
  require_command gpg

  if [ ! -f "$SSH_KEY_PATH" ]; then
    fatal "Expected '$SSH_KEY_PATH' to exists"
  fi

  if [ ! -d "$VA_SECRETS_REPO/.git" ]; then
    fatal "Expected '$VA_SECRETS_REPO' to contain git repository"
  fi

  pull_latest_secrets

  use_python_version "$PYTHON_VERSION"
  install_python_dependencies

  run_ansible "$@"
}

function run_ansible {
  local -r target="$ENV"

  case "$target" in
    qa)
      local -r limit="va_app_qa"
      local -r tags="all"
      ;;

    prod)
      local -r limit="va_app_prod"
      local -r tags="all"
      ;;

    loadbalancer)
      # Configuring loadbalancer requires that all hosts exist in inventory :mad:
      # This means we have to run ansible against all hosts and we have to use tags
      # to make sure only loadbalancer is configured.
      local -r limit="all"
      local -r tags="well-actually-only-loadbalancer"
      ;;

    jenkins)
      # Configuring jenkins requires that all hosts exist in inventory :mad:
      # This means we have to run ansible against all hosts and we have to use tags
      # to make sure only jenkins is configured.
      local -r limit="all"
      local -r tags="well-actually-only-jenkins"
      ;;

    *)
      fatal "Invalid target $target"
      ;;
  esac

  info "Running ansible"
  pushd "$repo/servers"
  ansible-playbook "$@" --tags "$tags" --limit "$limit" site.yml
  popd
}

function pull_latest_secrets {
  info "Pulling latest secrets"

  pushd "$VA_SECRETS_REPO"
  git pull
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
  python -m pipenv --rm
  python -m pipenv install > /dev/null
  source "$(python -m pipenv --venv)/bin/activate"

  if [ "$(python --version)" != "Python $PYTHON_VERSION" ]; then
    info "Python version has changed; rebuilding virtualenv"
    deactivate
    python -m pipenv --rm
    install_python_dependencies
  fi
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
  remove_all_files_ignored_or_untracked_by_git
fi
check_env
main "$@"
