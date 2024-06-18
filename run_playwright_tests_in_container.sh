#!/usr/bin/env bash

function main {
  npx --no playwright install --with-deps chromium
  npm run playwright:test "$@"
}

main "$@"
