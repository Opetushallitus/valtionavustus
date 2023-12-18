#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/common-functions.sh"

readonly gh_org="opetushallitus"
readonly gh_repo="valtionavustus"

function verify {
  read -r -p "> $1 " answer
}

function cdk-bootstrap {
  npm run cdk -- --app "bin/bootstrap.js" --output "cdk.out.bootstrap" "$@"
}

function main {
  require_command gh

  export PAGER=""

  if ! gh auth status; then
    fatal "Not authenticated with Github CLI"
  fi

  verify "Environment name:"
  if [ -z "$answer" ]; then
    fatal "Environment name can't be empty"
  fi
  readonly env_name="$answer"
  env_name_upper="$(echo "$env_name" | tr '[:lower:]' '[:upper:]')"
  readonly env_name_upper

  info "Bootstrapping '$env_name' environment"

  verify "Create environment $env_name in Github repository $gh_org/$gh_repo?"
  gh api --method PUT "repos/$gh_org/$gh_repo/environments/$env_name"

  # CDK bootstrap
  info "Prepare bootstrapping CDK"
  cd "$repo/cdk"

  require_docker
  require_federation_session

  init_nodejs
  npm_ci_if_package_lock_has_changed

  source "$VA_SECRETS_REPO/cdk_context.sh"
  readonly context_variable_name="AWS_ACCOUNT_ID_$env_name_upper"
  readonly aws_account_id="${!context_variable_name}"
  readonly aws_region="eu-west-1"

  verify "Run cdk bootstrap in account $aws_account_id in region $aws_region?"
  export AWS_PROFILE="oph-va-$env_name"
  export AWS_CONFIG_FILE="$VA_SECRETS_REPO/aws_config"

  npm run cdk -- bootstrap "$aws_account_id/$aws_region"


  # Deploy bootstrap CDK stacks
  info "Preparing to deploy bootstrap CDK app"
  info "Stacks in environment:"
  cdk-bootstrap list "$env_name/*"

  verify "Run cdk deploy for these stacks?"
  cdk-bootstrap deploy "$env_name/*"
}

main "$@"
