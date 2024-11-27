#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/common-functions.sh"

readonly gh_org="opetushallitus"
readonly gh_repo="valtionavustus"
readonly gh_team="reaktor-hellops"
readonly gh_deployment_role_secret="DEPLOY_ROLE_ARN"
readonly dist_dir="$repo/cdk/dist"

function create_env_in_github {
  info "Creating environment $ENV in Github repository $gh_org/$gh_repo"

  if [[ "$ENV" = "dev" || "$ENV" = "qa" ]]; then
    info "No review requirement in dev or qa"
    gh api --method PUT "repos/$gh_org/$gh_repo/environments/$ENV"
  else
    info "Environment requires review by team $gh_team"
    team_id="$(gh api "orgs/$gh_org/teams/$gh_team" --jq ".id")"
    readonly team_id

    gh api --method PUT "repos/$gh_org/$gh_repo/environments/$ENV" \
      --field "reviewers[][type]=Team" \
      --field "reviewers[][id]=$team_id"
    fi
}

readonly cdk_outdir="cdk.out.bootstrap"
readonly cdk_app="dist/bin/bootstrap.js"
readonly cdk_outputs="$dist_dir/outputs.json"

function prepare_cdk {
  cd "$repo/cdk"
  info "Preparing CDK"

  init_nodejs
  npm_ci_if_package_lock_has_changed

  npm run build
  ./cdk.sh --app "$cdk_app" --output "$cdk_outdir" synth
}

function deploy_cdk {
  cd "$repo/cdk"
  info "Deploying bootstrap stacks"

  ./cdk.sh --app "$cdk_outdir" --build "true" deploy --outputs-file "$cdk_outputs" "$ENV/*"
}

function bootstrap_cdk {
  cd "$repo/cdk"
  info "Bootstrapping CDK"

  require_aws_session "$ENV"
  require_cdk_context

  readonly context_variable_name="AWS_ACCOUNT_ID_$env_upper"
  readonly aws_account_id="${!context_variable_name}"
  readonly aws_region="eu-west-1"
  readonly us_east_1="us-east-1"

  info "Running cdk bootstrap in account $aws_account_id in region $aws_region and $us_east_1"
  REVISION=${revision} \
  npm run cdk -- bootstrap "$aws_account_id/$aws_region" "$aws_account_id/$us_east_1"
}

function set_deployment_role_secret {
  info "Setting deployment role ARN in Github Actions secrets"
  role_arn=$(jq --raw-output --exit-status ".[\"$ENV-github-actions-role\"].GithubActionOidcIamRoleArn" "$cdk_outputs")
  info "Deployment role ARN: $role_arn"
  info "Setting $gh_deployment_role_secret in $ENV"
  echo -n "$role_arn" | \
    gh secret set "$gh_deployment_role_secret" \
    --app actions \
    --repo "$gh_org/$gh_repo" \
    --env "$ENV"
}

function main {
  parse_env_from_script_name "bootstrap"
  check_env

  require_command gh
  require_docker

  export PAGER=""

  if ! gh auth status; then
    fatal "Not authenticated with Github CLI"
  fi

  env_upper="$(echo "$ENV" | tr '[:lower:]' '[:upper:]')"
  readonly env_upper

  rm -rf "$dist_dir"
  mkdir -p "$dist_dir"

  info "Bootstrapping '$ENV' environment"

  create_env_in_github
  prepare_cdk
  bootstrap_cdk
  deploy_cdk
  set_deployment_role_secret
}

main "$@"
