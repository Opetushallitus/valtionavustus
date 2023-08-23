#!/usr/bin/env bash

function main {
  npm run playwright:test "$@"
}

main "$@"
