#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

readonly repo="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )"
readonly VA_SECRETS_REPO="$repo/../valtionavustus-secret"
readonly node_version="16.17.1"
readonly ansible_version="4.6.0"
readonly python_version="3.9.0"
readonly local_docker_namespace="va"

readonly HAKIJA_HOSTNAME=${HAKIJA_HOSTNAME:-"localhost"}
readonly VIRKAILIJA_HOSTNAME=${VIRKAILIJA_HOSTNAME:-"localhost"}
readonly DOCKER_COMPOSE_FILE="$repo"/docker-compose-test.yml

function remove_all_files_ignored_or_untracked_by_git {
  git clean -xdf
}

function install_docker_compose {
  info "Installing docker compose"
  curl -L "https://github.com/docker/compose/releases/download/v2.17.0/docker-compose-$(uname -s)-$(uname -m)" -o "$repo"/scripts/docker-compose
  chmod u+x "$repo"/scripts/docker-compose
  "$repo"/scripts/docker-compose --version
}

function check_requirements {
  require_command curl
}

function make_clean() {
  time make clean
}

function make_build() {
  add_git_head_snippets
  time make build
}

function add_git_head_snippets() {
  info "Adding git head snippets..."
  git show --pretty=short --abbrev-commit -s HEAD > "$repo"/server/resources/public/git-HEAD.txt
}

function docker-compose () {
    if running_on_jenkins; then
      "$repo"/scripts/docker-compose "$@"
    else
      docker compose "$@"
    fi
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
    -v "$repo"/fakesmtp/mail:/mail \
    bash:latest bash -c "chown -R ${CURRENT_USER_ID}:${CURRENT_USER_GID} /playwright-results /mail"

  set -e
}

function start_system_under_test () {
  info "Starting system under test"
  if running_on_jenkins
  then
    disable_docker_buildkit_builder
  fi

  docker-compose -f "$DOCKER_COMPOSE_FILE" up -d hakija
  wait_for_container_to_be_healthy va-hakija

  docker-compose -f "$DOCKER_COMPOSE_FILE" up -d virkailija
  wait_for_container_to_be_healthy va-virkailija

  if [ ${VERBOSE:-"false"} == "true" ]
  then
    follow_service_logs
  fi
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
  export PLAYWRIGHT_WORKERS=6
  export SPECLJ_ARGS="-f junit"

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
  docker-compose -f "${DOCKER_COMPOSE_FILE}" up --force-recreate ${service_name}
  popd
}

function build_and_test_jars {
  check_requirements
  init_nodejs
  make_clean
  make_build
  start_system_under_test
  run_tests
  stop_system_under_test
}
