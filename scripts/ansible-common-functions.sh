#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

readonly PYTHON_VERSION="3.9.0"

function use_python_version {
  require_command pyenv
  info "Installing python version $PYTHON_VERSION"

  pushd "$repo"
  eval "$(pyenv init -)"
  if pyenv init --path; then
    # Newer pyenv versions that have --path flag require this to set PATH properly
    eval "$(pyenv init --path)"
  fi
  pyenv install --skip-existing "$PYTHON_VERSION"
  pyenv local "$PYTHON_VERSION"
  popd
}

function install_python_and_dependencies {
  info "installing Python dependencies"
  use_python_version

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
