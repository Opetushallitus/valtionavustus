#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
# shellcheck source=scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

# CDK infrastructure unit tests (node --test) — no running env needed.
"$repo/cdk/run-tests.sh"

# Playwright E2E tests require the local dev environment to be running.
# Verify the va server healthcheck responds before attempting them.
if ! curl --silent --fail --max-time 5 http://localhost:8081/api/healthcheck > /dev/null 2>&1; then
  echo "ERROR: dev environment is not running (http://localhost:8081/api/healthcheck unreachable)."
  echo "Start it first with: task dev"
  exit 1
fi

# Extra args are passed through to Playwright, e.g. `./run-tests.sh tests/emails.test.ts`.
"$repo/run_isolated_system_tests.sh" "$@"
