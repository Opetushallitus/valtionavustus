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
readonly ansible_version="8.1.0"
readonly python_version="3.9.0"
readonly local_docker_namespace="va"

readonly HAKIJA_HOSTNAME=${HAKIJA_HOSTNAME:-"localhost"}
readonly VIRKAILIJA_HOSTNAME=${VIRKAILIJA_HOSTNAME:-"localhost"}
readonly DOCKER_COMPOSE_FILE="$repo"/docker-compose-test.yml

readonly AWS_CLI_VERSION="2.15.1"

function require_federation_session {
  session_expiration="$(aws configure get expiration --profile oph-federation)"
  now_timestamp="$(date +"%Y-%m-%dT%H:%M:%S")"

  if [ "$session_expiration" = "None" ]; then
    fatal "No session for oph-federation"
  elif [[ "$session_expiration" < "$now_timestamp" ]]; then
    fatal "oph-federation session expired ($session_expiration)"
  else
    info "oph-federation session ok (expires $session_expiration)"
  fi
}

function configure_aws {
  export AWS_REGION="eu-west-1"
  if ! running_on_gh_actions; then
    check_env
    export AWS_PROFILE="oph-va-$ENV"
    export AWS_CONFIG_FILE="$VA_SECRETS_REPO/aws_config"
    info "Using AWS config from secrets repo, with profile $AWS_PROFILE"
  fi
}

function aws {
  docker run --interactive --rm \
    --env AWS_PROFILE \
    --env AWS_REGION \
    --env AWS_DEFAULT_REGION \
    --env AWS_ACCESS_KEY_ID \
    --env AWS_SECRET_ACCESS_KEY \
    --env AWS_SESSION_TOKEN \
    --env AWS_CONFIG_FILE=/aws_config \
    --volume "$VA_SECRETS_REPO/aws_config:/aws_config" \
    --volume "$HOME/.aws:/root/.aws" \
    "public.ecr.aws/aws-cli/aws-cli:$AWS_CLI_VERSION" \
    "$@"
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

function stop_system_under_test () {
  info "Stopping system under test"
  docker-compose -f "${DOCKER_COMPOSE_FILE}" down --remove-orphans
}

function stop_systems_under_test  {
  info "Stopping all systems under test"
  fix_directory_permissions_after_test_run
  stop_system_under_test
}

function fix_directory_permissions_after_test_run {
  info "Fixing directory permissions after test run"

  set +e
  CURRENT_USER_ID="$(id -u)"
  CURRENT_USER_GID="$(id -g)"

  docker run \
    --env CURRENT_USER_ID="${CURRENT_USER_ID}" \
    --env CURRENT_USER_GID="${CURRENT_USER_GID}" \
    --rm \
    -v "$repo"/playwright-results:/playwright-results \
    -v "$repo"/fakesmtp:/fakesmtp \
    bash:latest bash -c "chown -R ${CURRENT_USER_ID}:${CURRENT_USER_GID} /playwright-results /fakesmtp"

  set -e
}

function start_system_under_test () {
  info "Starting system under test"
  if running_on_jenkins
  then
    disable_docker_buildkit_builder
  fi

  REVISION="${revision}" docker-compose -f "$DOCKER_COMPOSE_FILE" up --force-recreate --build -d va
  local container_name
  container_name="$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps --quiet va)"
  wait_for_container_to_be_healthy va

  follow_service_logs
}

function disable_docker_buildkit_builder {
  export DOCKER_BUILDKIT=0
}

function follow_service_logs {
  docker-compose -f "$DOCKER_COMPOSE_FILE" logs --follow &
}

function run_tests() {
  info "Running isolated system tests"
  export HEADLESS=true
  if running_on_jenkins; then
    export PLAYWRIGHT_WORKERS=6
    export SPECLJ_ARGS="-f junit"
  fi

  "$repo"/run_isolated_system_tests.sh
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

function ansible-playbook {
  ansible-command "ansible-playbook" "$@"
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

function start-service {
  local service_name=$1
  pushd "$repo"
  docker-compose -f "${DOCKER_COMPOSE_FILE}" up --force-recreate --build ${service_name}
  popd
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

function build_jars {
  require_command curl

  init_nodejs

  make clean
  echo "${revision}" > "${repo}"/server/resources/public/version.txt
  make build
  rm "${repo}"/server/resources/public/version.txt
}

function current-commit-is-not-tested {
  ! git tag --contains | grep -q "green-qa"
}

function build_and_test_jars {
  build_jars

  if current-commit-is-not-tested;
  then
    start_system_under_test
    run_tests
    stop_system_under_test
  fi
}
