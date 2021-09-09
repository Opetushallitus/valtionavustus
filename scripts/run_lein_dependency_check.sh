#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

function lein_dep_check_for_project () {
  local project_dir=$1

  local EXIT=0
  cd "$repo/$project_dir"
  ../lein nvd check || EXIT=$?
  return $EXIT
}

function download_temp_db_to_workspace_in_jenkins() {
  set +u
  if [[ ! -z ${WORKSPACE} ]]; then
    export JAVA_TOOL_OPTIONS=-Djava.io.tmpdir=${WORKSPACE}
  fi
  set -u
}

function main {
  local EXIT=0

  set +o errexit
  download_temp_db_to_workspace_in_jenkins
  lein_dep_check_for_project "soresu-form" || EXIT=$?
  lein_dep_check_for_project "va-admin-ui" || EXIT=$?
  lein_dep_check_for_project "va-common" || EXIT=$?
  lein_dep_check_for_project "va-hakija" || EXIT=$?
  lein_dep_check_for_project "va-virkailija" || EXIT=$?
  set -o errexit

  return $EXIT
}

main "$@"
