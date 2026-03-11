#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( dirname "${BASH_SOURCE[0]}" )/common-functions.sh"

function ensure_open_file_limit {
  local -r desired_limit="${FRONTEND_OPEN_FILES_LIMIT:-65536}"
  local current_limit
  current_limit="$(ulimit -n)"

  if [[ "$current_limit" =~ ^[0-9]+$ ]] && [ "$current_limit" -lt "$desired_limit" ]; then
    if ulimit -n "$desired_limit" >/dev/null 2>&1; then
      info "Raised open file limit from $current_limit to $desired_limit for webpack watch"
    else
      info "Could not raise open file limit from $current_limit to $desired_limit; watch may fail with EMFILE"
    fi
  fi
}

function main {
  init_nodejs
  ensure_open_file_limit
  cd "$repo"
  npm_ci_if_package_lock_has_changed
  npm run build-watch
}

main "$@"
