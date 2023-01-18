#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"
readonly LEIN="$repo/lein"

function delete_temp_files_if_running_on_jenkins () {
  if running_on_jenkins; then
    echo "Deleting nvd temp files at ${WORKSPACE}/dctemp*"
    rm -rf ${WORKSPACE}/dctemp*
  fi
}

trap delete_temp_files_if_running_on_jenkins EXIT

function lein_dep_check () {
  cd "$repo/dependency-check"

  local configuration="nvd-config.json"

  if running_on_jenkins; then
    "$LEIN" with-profile -user run -m nvd.task.check "$configuration" "$(cd "$repo"; $LEIN classpath)"
  else
    "$LEIN" run -m nvd.task.check "$configuration" "$(cd "$repo"; $LEIN classpath)"
  fi

}

function download_temp_db_to_workspace_in_jenkins() {
  if running_on_jenkins; then
    remove_all_files_ignored_or_untracked_by_git
    export JAVA_TOOL_OPTIONS=-Djava.io.tmpdir=${WORKSPACE}
  fi
}

function main {
  download_temp_db_to_workspace_in_jenkins
  lein_dep_check
}

main "$@"
