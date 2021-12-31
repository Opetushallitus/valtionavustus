#!/usr/bin/env bash

function main {
  npm run playwright:test
  TZ=Europe/Stockholm npm run playwright:test playwright/tests/email-notifications/hakuaika-paattymassa.test.ts
}

main "$@"
