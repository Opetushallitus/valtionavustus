#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/common-functions.sh"

readonly profile="oph-federation"

function update_credential_expiration {
  readonly expiration="$1"

  readonly profile_start="^\\[$profile\\]"
  readonly next_profile_start="^\\[.*\\]"
  readonly credentials_file="$HOME/.aws/credentials"
  readonly credentials_file_tmp="$credentials_file.tmp"
  sed "/$profile_start/,/$next_profile_start/  s/expiration = .*/expiration = $expiration/" "$credentials_file" \
    > "$credentials_file_tmp" \
    && mv "$credentials_file_tmp" "$credentials_file"
}

function main {
  require_command jq
  read -r -p "oph-federation account MFA token: " mfa_code

  aws_arn_mfa="$(aws configure get aws_arn_mfa --profile "$profile")"
  token_response="$(aws sts get-session-token \
    --token-code "$mfa_code" \
    --serial-number "$aws_arn_mfa" \
    --output json \
    --profile "${profile}-default")"

  expiration="$(jq --raw-output '.Credentials.Expiration' <<< "$token_response")"
  aws_access_key_id="$(jq --raw-output '.Credentials.AccessKeyId' <<< "$token_response")"
  aws_secret_access_key="$(jq --raw-output '.Credentials.SecretAccessKey' <<< "$token_response")"
  aws_session_token="$(jq --raw-output '.Credentials.SessionToken' <<< "$token_response")"

  update_credential_expiration "$expiration"
  aws configure set aws_access_key_id "$aws_access_key_id" --profile "$profile"
  aws configure set aws_secret_access_key "$aws_secret_access_key" --profile "$profile"
  aws configure set aws_session_token "$aws_session_token" --profile "$profile"

  info "Session refreshed, expires on $expiration"
}

main "$@"