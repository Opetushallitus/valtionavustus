#!/usr/bin/env bash
function wait_until_virkailija_is_listening {
  info "Waiting until port virkailija-server is listening"
  while ! nc -z virkailija 8081; do
    sleep 1
  done
}

function main {
  info "Waiting for hakija server to start..."
  wait_until_virkailija_is_listening
  npm run playwright:test
}

main "$@"
