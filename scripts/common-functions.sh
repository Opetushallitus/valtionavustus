#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# allow sourcing this file multiple times from different scripts
if [ -n "${COMMON_FUNCTIONS_SOURCED:-}" ]; then
  return
fi
readonly COMMON_FUNCTIONS_SOURCED="true"


repo="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )" && readonly repo
readonly revision="${GITHUB_SHA:-$(git rev-parse HEAD)}"
readonly VA_SECRETS_REPO="$repo/../valtionavustus-secret"
node_version="$(cat "$repo/.nvmrc")" && readonly node_version
node_version_cdk="$(cat "$repo/cdk/.nvmrc")" && readonly node_version_cdk
readonly ansible_version="8.1.0"
readonly python_version="3.9.0"
readonly local_docker_namespace="va"

readonly HAKIJA_HOSTNAME=${HAKIJA_HOSTNAME:-"localhost"}
readonly VIRKAILIJA_HOSTNAME=${VIRKAILIJA_HOSTNAME:-"localhost"}
readonly DOCKER_COMPOSE_FILE="$repo"/docker-compose-test.yml

readonly AWS_CLI_VERSION="2.15.1"

function require_federation_session {
  info "Verifying that oph-federation session has not expired"

  aws sts get-caller-identity --profile=oph-federation 1>/dev/null || {
    fatal "Could not check that AWS credentials are working. Please log in with cdk/scripts/refresh-oph-federation-session.sh"
    exit 254
  }
}

function require_cdk_context {
  if ! running_on_gh_actions; then
    source "$VA_SECRETS_REPO/cdk_context.sh"
  fi
}

function configure_aws {
  export AWS_REGION="eu-west-1"
  if ! running_on_gh_actions; then
    check_env
    export AWS_PROFILE="oph-va-$ENV"
    info "Using AWS config from secrets repo, with profile $AWS_PROFILE"
  fi
}

function aws {
  if running_on_gh_actions; then
    docker run --interactive --rm \
      --env AWS_REGION \
      --env AWS_DEFAULT_REGION \
      --env AWS_ACCESS_KEY_ID \
      --env AWS_SECRET_ACCESS_KEY \
      --env AWS_SESSION_TOKEN \
      "public.ecr.aws/aws-cli/aws-cli:$AWS_CLI_VERSION" \
      "$@"
  else
    docker run --interactive --rm \
      --env AWS_PROFILE \
      --env AWS_REGION \
      --env AWS_DEFAULT_REGION \
      --env AWS_CONFIG_FILE="/aws_config" \
      --mount "type=bind,source=$VA_SECRETS_REPO/aws_config,destination=/aws_config,readonly" \
      --volume "$HOME/.aws:/root/.aws" \
      "public.ecr.aws/aws-cli/aws-cli:$AWS_CLI_VERSION" \
      "$@"
  fi
}

function check_env {
  if [ -z "${ENV:-}" ]; then
    fatal "\$ENV not set"
  fi

  if [[ "$ENV" != "dev" && "$ENV" != "qa" && "$ENV" != "prod" ]]; then
    fatal "Unknown env '$ENV'"
  fi
}

function docker-compose () {
    if running_on_jenkins; then
      "$repo"/scripts/docker-compose "$@"
    else
      docker compose "$@"
    fi
}

function require_docker_compose {
  docker compose > /dev/null || fatal "docker compose missing"
}

function disable_docker_buildkit_builder {
  export DOCKER_BUILDKIT=0
}

function parse_env_from_script_name {
  local BASE_FILENAME="$1"
  FILE_NAME=$(basename "$0")
  if echo "${FILE_NAME}" | grep -E -q "$BASE_FILENAME-.([^-]+)\.sh"; then
    ENV=$(echo "${FILE_NAME}" | sed -E -e "s|$BASE_FILENAME-([^-]+)\.sh|\1|g")
    export ENV
    info "Targeting environment [${ENV}]"
  else
    fatal "Don't call this script directly"
  fi
}

function running_on_jenkins {
  [ "${JENKINS_HOME:-}" != "" ]
}

function running_on_gh_actions {
  [ "${GITHUB_ACTIONS:-}" == "true" ]
}

function init_nodejs {
  export NVM_DIR="${NVM_DIR:-$HOME/.cache/nvm}"
  set +o errexit
  source "$repo/nvm.sh"
  nvm use "${node_version}" || nvm install -b "${node_version}" # -b means install from binary only, better fail fast than compile node for three hours
  set -o errexit
}

# using 20 temporarily just for cdk until we can get rid of 16 elsewhere
function init_nodejs_cdk {
  export NVM_DIR="${NVM_DIR:-$HOME/.cache/nvm}"
  set +o errexit
  source "$repo/nvm.sh"
  nvm use "${node_version_cdk}" || nvm install -b "${node_version_cdk}" # -b means install from binary only, better fail fast than compile node for three hours
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
    info "new package-lock.json; running npm ci"
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
  docker ps > /dev/null 2>&1 || fatal "Running 'docker ps' failed. Is docker daemon running? Aborting."
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

function ansible-vault {
  ansible-command "ansible-vault" "$@"
}

function ansible-command {
  local -r command="$1"
  shift
  local -r image="${local_docker_namespace}/${command}"
  local -r tag="${python_version}-${ansible_version}"
  local -r ansible_vault_password_file=$(mktemp)
  local -r ssh_config=$(mktemp)
  local -r docker_work_dir=/servers
  local -r user=$(whoami)

  trap "rm -f ${ansible_vault_password_file} ${ssh_config}" EXIT
  local -r password=$("${repo}/servers/gpg-wrapper.sh")

  cat <<EOF > "$ansible_vault_password_file"
#!/usr/bin/env bash
echo "${password}"
EOF
  chmod u+x "$ansible_vault_password_file"

  cat <<EOF > "$ssh_config"
Host *
  User ${user}
EOF

  if ! docker image inspect ${image}:${tag} 2>&1 > /dev/null; then
    docker build \
           --tag ${image}:${tag} \
           - <<EOF
FROM python:${python_version}
RUN apt-get update && apt-get -y install vim
RUN pip3 install ansible==${ansible_version}
WORKDIR ${docker_work_dir}
ENTRYPOINT ["$command"]
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

CURRENT_GROUP=""
GROUP_START_TIME=0
function start_gh_actions_group {
  local group_title="$1"
  GROUP_START_TIME=$(date +%s)
  CURRENT_GROUP="$group_title"

  if [ "${GITHUB_ACTIONS:-}" == "true" ]; then
    echo "::group::$group_title"
  fi
}

function end_gh_actions_group {
  if [ "${GITHUB_ACTIONS:-}" == "true" ]; then
    echo "::endgroup::"
  fi
  END_TIME=$(date +%s)
  info "$CURRENT_GROUP took $(( END_TIME - GROUP_START_TIME )) seconds"
}


