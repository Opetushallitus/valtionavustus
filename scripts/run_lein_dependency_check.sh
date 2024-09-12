#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"
readonly LEIN="$repo/lein"

function lein_dep_check () {
  cd "$repo/dependency-check"

  local configuration="nvd-config.json"
  local classpath="$(cd "$repo"; $LEIN classpath)"

  "$LEIN" run -m nvd.task.check "$configuration" "$classpath"
}

function main {
  lein_dep_check
}

main "$@"
