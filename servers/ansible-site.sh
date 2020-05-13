#!/usr/bin/env bash

repo=$( cd "$( dirname "$0" )" && pwd )

function main {
  do_python_magic

  ansible-playbook site.yml
}

function do_python_magic {
  require_command pyenv
  eval "$(pyenv init -)"

  pushd "$repo"
  python -m pip install pipenv
  python -m pipenv install --dev
  source "$(pipenv --venv)/bin/activate"
  popd
}

function require_command {
  command -v "$1" > /dev/null 2>&1 || { echo >&2 "I require $1 but it's not installed. Aborting."; exit 1; }
}

if [[ -z "${ANSIBLE_VAULT_PASSWORD_FILE}" ]]; then
  echo >&2 "I require ANSIBLE_VAULT_PASSWORD_FILE environment variable but it is not set. Aborting."
  exit 1
fi

main "$@"

