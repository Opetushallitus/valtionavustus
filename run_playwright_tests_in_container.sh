#!/usr/bin/env bash

function main {
  npm run prettier-check-project
  npm run playwright:test
}

main "$@"
