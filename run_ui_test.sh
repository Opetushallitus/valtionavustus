#!/usr/bin/env bash
node_version="12.13.1"
npm_version="6.13.4"
set -o errexit -o nounset -o pipefail
repo="$( cd "$( dirname "$0" )" && pwd )"

HAKIJA_HOSTNAME=${HAKIJA_HOSTNAME:-"localhost"}
VIRKAILIJA_HOSTNAME=${VIRKAILIJA_HOSTNAME:-"localhost"}

function check_requirements {
  if ! [[ -x "$(command -v curl)" ]]; then
    echo "Curl is required, cannot continue"
    exit 1
  fi
}

function waitport {
  i=0
  HOSTNAME=$1
  PORT=$2
  MAX_WAIT=${3:-100}

  while ! curl -s "http://${HOSTNAME}:${PORT}/" > /dev/null; do
    echo "Waiting for port ${PORT} to respond on host ${HOSTNAME}, ${i}/${MAX_WAIT}"

    if [[ $i -gt ${MAX_WAIT} ]]; then
      echo "Port not responding and max time exceeded, exiting..."
      exit 1
    fi

    sleep 1
    ((i=i+1))
  done

  echo "Port ${PORT} is responding on host ${HOSTNAME}"
}

function main {
  check_requirements
  init_nodejs

  export ADBLOCK=1
  cd "$repo"
  npm install

  waitport ${HAKIJA_HOSTNAME} 8080 150
  waitport ${VIRKAILIJA_HOSTNAME} 8081 150

  npx mocha "test/**/*Spec.js"
}

function init_nodejs {
  export NVM_DIR="${NVM_DIR:-$HOME/.cache/nvm}"
  source "$repo/nvm.sh"
  nvm use "${node_version}" || nvm install "${node_version}"
  npm install -g "npm@${npm_version}"
}

main "$@"
