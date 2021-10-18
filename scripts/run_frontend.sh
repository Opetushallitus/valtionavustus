#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( dirname "${BASH_SOURCE[0]}" )/common-functions.sh"

function main {
  cd "$repo"
  npm_ci_if_package_lock_has_changed
  #npm install --save baconjs@latest
  #npm uninstall --save-dev @types/baconjs
  npm run build-watch
}

main "$@"
