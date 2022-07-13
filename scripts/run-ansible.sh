#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

readonly SSH_KEY_PATH="$HOME/.ssh/oph-valtionavustus"
readonly VA_SECRETS_REPO="$repo/../valtionavustus-secret"

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

function ansible-playbook {
  local -r image="${local_docker_namespace}/ansible-playbook"
  local -r tag="${python_version}-${ansible_version}"
  local -r ansible_vault_password_file=$(mktemp)
  local -r ssh_config=$(mktemp)
  local -r docker_work_dir=/servers
  local -r user=$(whoami)

  trap "rm -f ${ansible_vault_password_file} ${ssh_config}" EXIT
  local -r password=$("${repo}/servers/gpg-wrapper.sh")

  cat <<EOF > ${ansible_vault_password_file}
#!/usr/bin/env bash
echo "${password}"
EOF
  chmod u+x ${ansible_vault_password_file}

  cat <<EOF > ${ssh_config}
Host *
  User ${user}
EOF

  if ! docker image inspect ${image}:${tag} 2>&1 > /dev/null; then
    docker build \
           --tag ${image}:${tag} \
           - <<EOF
FROM python:${python_version}
RUN pip3 install ansible==${ansible_version}
WORKDIR ${docker_work_dir}
ENTRYPOINT ["ansible-playbook"]
EOF
  fi

  docker run \
         --rm \
         --tty \
         --interactive \
         --volume "${repo}/servers":"${docker_work_dir}" \
         --volume "${ssh_config}":"${docker_work_dir}/ssh.config" \
         --volume "${ansible_vault_password_file}":"${docker_work_dir}/gpg-wrapper.sh" \
         --volume "${VA_SECRETS_REPO}/servers/va-secrets-vault.yml":"${docker_work_dir}/group_vars/all/vault.yml" \
         --volume "${VA_SECRETS_REPO}/servers/va-secrets-qa-vault.yml":"${docker_work_dir}/group_vars/va_app_qa/vault.yml" \
         --volume "${VA_SECRETS_REPO}/servers/va-secrets-prod-vault.yml":"${docker_work_dir}/group_vars/va_app_prod/vault.yml" \
         --volume "${VA_SECRETS_REPO}/config":"${docker_work_dir}/config" \
         --env SSH_AUTH_SOCK="/run/host-services/ssh-auth.sock" \
         --mount type=bind,src=/run/host-services/ssh-auth.sock,target=/run/host-services/ssh-auth.sock \
         ${image}:${tag} \
         "$@"
}

if [ "${JENKINS_HOME:-}" != "" ]; then
  docker image prune --force
  remove_all_files_ignored_or_untracked_by_git
fi
parse_env_from_script_name "run-ansible"
main "$@"
