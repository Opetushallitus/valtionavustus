#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( dirname "${BASH_SOURCE[0]}" )/common-functions.sh"

function main {
  # set_aws_environment_variables
  # local -r token="$( get_secret_value jenkins-admin-token )"
  # curl -X GET --user "admin:${token}" http://localhost:8080/api/json?pretty=true > buildstatus.json

  # AWS_PROFILE=buildstatus aws s3 cp /aws/buildstatus.json s3://buildstatus/buildstatus/lampi/buildstatus.json
  echo hello!!!
}

main "$@"
