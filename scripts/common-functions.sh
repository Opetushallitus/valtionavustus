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
export NODE_VERSION="${node_version}"
readonly local_docker_namespace="va"

readonly HAKIJA_HOSTNAME=${HAKIJA_HOSTNAME:-"localhost"}
readonly VIRKAILIJA_HOSTNAME=${VIRKAILIJA_HOSTNAME:-"localhost"}

readonly AWS_CLI_VERSION="2.22.17"

function require_cdk_context {
  if ! running_on_gh_actions; then
    source "$VA_SECRETS_REPO/cdk_context.sh"
  fi
}

function configure_aws {
  export AWS_REGION="eu-west-1"
  if ! running_on_gh_actions; then
    check_env
    export AWS_PROFILE="oph-valtionavustukset-$ENV"
    info "Using AWS config with profile $AWS_PROFILE"
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
      --volume "$HOME/.aws:/root/.aws" \
      --env AWS_CONFIG_FILE="/root/.aws/config" \
      "public.ecr.aws/aws-cli/aws-cli:$AWS_CLI_VERSION" \
      "$@"
  fi
}

function require_aws_session {
    info "Verifying that AWS session has not expired for oph-valtionavustukset-$1"
    aws sts get-caller-identity --profile "oph-valtionavustukset-$1" 1>/dev/null || {
      info "Session is expired"
      aws --profile "oph-valtionavustukset-$1" sso login --use-device-code
    }
    export AWS_PROFILE="oph-valtionavustukset-$1"
    export AWS_REGION="eu-west-1"
    export AWS_DEFAULT_REGION="$AWS_REGION"
    info "Using AWS profile $AWS_PROFILE"
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
  docker compose "$@"
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

function build_and_refresh_pom_and_bom {
  require_command docker
  require_command jq
  echo "Building artifacts stage to refresh pom.xml and bom.json…"
  DOCKER_BUILDKIT=1 docker build \
    --build-arg "NODE_VERSION=${node_version}" \
    --build-arg "REVISION=${revision}" \
    --file Dockerfile.va-app \
    --target artifacts \
    --output type=local,dest=. \
    .

  # Sanity check
  test -s "$repo/pom.xml" || { echo "ERROR: pom.xml not produced or missing"; exit 1; }
  test -s "$repo/bom.json" || { echo "ERROR: bom.json not produced or missing"; exit 1; }

  # Create the file to be compared against
  if git show HEAD:bom.json >/dev/null 2>&1; then
    git show HEAD:bom.json > bom.old.json
  else
    printf '{}' > bom.old.json
  fi

  # drop fields that change on every bom generation for comparison
  normalize() {
    jq 'del(.serialNumber, .metadata.timestamp)'
  }

  normalize < bom.old.json > bom.old.norm.json
  normalize < bom.json     > bom.new.norm.json

  if cmp -s bom.old.norm.json bom.new.norm.json; then
    echo "BOM unchanged (ignoring serialNumber/timestamp). Restoring previous bom.json to avoid noisy commit."
    git show HEAD:bom.json > bom.json || true
  else
    echo "BOM changed materially. Keeping refreshed bom.json."
  fi
  # Cleanup comparison files
  rm -f bom.old.json bom.old.norm.json bom.new.norm.json
}
