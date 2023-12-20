#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./deploy-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/deploy-functions.sh"

readonly cdk_out="cdk.out.deploy"

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
