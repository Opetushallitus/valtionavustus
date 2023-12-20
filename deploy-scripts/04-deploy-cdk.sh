#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./deploy-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/deploy-functions.sh"

readonly cdk_out="cdk.out.deploy"

function print_env {
  local env_name="$1"
  local env_value="${!env_name}"

  local env_begin="${env_value:0:3}"
  local env_rest="${env_value:3}"
  echo "$env_name: ${env_begin}${env_rest//?/*}"
}

function setup {
  require_command docker
  require_built_image
  configure_aws

  cd "$repo/cdk"
  init_nodejs
  npm_ci_if_package_lock_has_changed
}

function cdk-built-app {
  ./cdk.sh --app "$cdk_out" --build "true" "$@"
}

function main {
  readonly ENV="$1"
  check_env

  info "Deploying to environment $ENV"

  require_cdk_context
  print_env "AWS_ACCOUNT_ID_DEV"
  print_env "AWS_ACCOUNT_ID_QA"
  print_env "AWS_ACCOUNT_ID_PROD"

  start_gh_actions_group "Setup"
  setup
  end_gh_actions_group

  cd "$repo/cdk"
  start_gh_actions_group "Synth CDK app"
  ./cdk.sh synth --output "$cdk_out"
  end_gh_actions_group

  start_gh_actions_group "Diff stacks"
  cdk-built-app diff "$ENV/*"
  end_gh_actions_group

  start_gh_actions_group "Deploy stacks"
  cdk-built-app deploy \
    --exclusively \
    --require-approval never \
    "$ENV/*"
  end_gh_actions_group
}

main "$@"
