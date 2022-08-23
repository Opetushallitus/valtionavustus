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

function lein_dep_check_for_project () {
  local project_dir=$1
  local dir="$repo/$project_dir"
  lein_dep_check_in_dir "$dir"
}

function lein_dep_check () {
  local dir="$repo"
  lein_dep_check_in_dir "$dir"
}

function lein_dep_check_in_dir () {
  local dir=$1

  local EXIT=0
  nvd_check $dir || EXIT=$?
  delete_temp_files_if_running_on_jenkins
  return $EXIT
}

function nvd_check {
  local dir=$1
  cd "$repo/dependency-check"

  project=$(basename "$dir")

  "$LEIN" with-profile -user run -m nvd.task.check "$project"-nvd-config.json "$(cd "$dir"; $LEIN classpath)"
}

function download_temp_db_to_workspace_in_jenkins() {
  if running_on_jenkins; then
    remove_all_files_ignored_or_untracked_by_git
    export JAVA_TOOL_OPTIONS=-Djava.io.tmpdir=${WORKSPACE}
  fi
}

function main {
  local EXIT=0

  install_soresu_jar

  set +o errexit
  download_temp_db_to_workspace_in_jenkins
  lein_dep_check_for_project "soresu-form" || EXIT=$?
  lein_dep_check || EXIT=$?
  set -o errexit

  return $EXIT
}

function install_soresu_jar {
  cd $repo/soresu-form
  "$LEIN" install
  cd $repo
}

main "$@"
