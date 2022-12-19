#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

readonly SSH_KEY_PATH="$HOME/.ssh/oph-valtionavustus"

function main {
  info "Running ansible against $ENV environment"
  require_command gpg

  if [ ! -f "$SSH_KEY_PATH" ]; then
    fatal "Expected '$SSH_KEY_PATH' to exists"
  else
    info "Adding $SSH_KEY_PATH to ssh agent"
    ssh-add --apple-use-keychain "$SSH_KEY_PATH"
  fi

  if [ ! -d "$VA_SECRETS_REPO/.git" ]; then
    fatal "Expected '$VA_SECRETS_REPO' to contain git repository"
  fi

  pull_latest_secrets

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
  ansible-playbook "$@" --tags "$tags" --limit "$limit" site.yml
}

function pull_latest_secrets {
  info "Pulling latest secrets"

  pushd "$VA_SECRETS_REPO"
  git pull
  popd
}


if [ "${JENKINS_HOME:-}" != "" ]; then
  docker image prune --force
  remove_all_files_ignored_or_untracked_by_git
fi
parse_env_from_script_name "run-ansible"
main "$@"
