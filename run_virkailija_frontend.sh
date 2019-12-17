#!/usr/bin/env bash
node_version="12.13.1"
npm_version="6.13.4"
set -o errexit -o nounset -o pipefail
repo="$( cd "$( dirname "$0" )" && pwd )"

function main {
  init_nodejs

  cd "$repo"
  npm install
  npm run virkailija:build-watch
}

function init_nodejs {
  export NVM_DIR="${NVM_DIR:-$HOME/.cache/nvm}"
  source "$repo/nvm.sh"
  nvm use "${node_version}" || nvm install "${node_version}"
  npm install -g "npm@${npm_version}"
}

main "$@"
