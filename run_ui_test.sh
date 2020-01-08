#!/usr/bin/env bash
node_version="12.13.1"
npm_version="6.13.4"
set -o errexit -o nounset -o pipefail
repo="$( cd "$( dirname "$0" )" && pwd )"

function main {
  init_nodejs

  [ -z "${ADMIN_USERNAME:-}" ] && fail "ADMIN_USERNAME should be set username of pääkäyttäjä"
  [ -z "${ADMIN_PASSWORD:-}" ] && fail "ADMIN_PASSWORD should be set password of pääkäyttäjä"

  export ADBLOCK=1
  cd "$repo"
  npm install
  npx mocha "test/**/*Spec.js"
}

function init_nodejs {
  export NVM_DIR="${NVM_DIR:-$HOME/.cache/nvm}"
  source "$repo/nvm.sh"
  nvm use "${node_version}" || nvm install "${node_version}"
  npm install -g "npm@${npm_version}"
}

main "$@"
