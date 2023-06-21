#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

trap clean EXIT

readonly RESULTS_DIR="$repo/playwright-results"
compose="docker-compose -f docker-compose.yml -f docker-compose-playwright.yml"

function clean {
  $compose down
}

function main {
  require_command docker
  require_docker_compose

  mkdir -p "$RESULTS_DIR"

  start_gh_actions_group "Build images required for playwright tests"
  $compose up --build --wait db va fakesmtp maksatuspalvelu
  docker build -t playwright-image -f Dockerfile.playwright-test-runner .
  end_gh_actions_group

  start_gh_actions_group "run playwright tests"
  docker run --rm --network valtionavustus-playwright_default \
  -v "$RESULTS_DIR":/playwright-results\
  --env TZ='Europe/Helsinki'\
  --env VIRKAILIJA_HOSTNAME=va\
  --env HAKIJA_HOSTNAME=va\
  --env HEADLESS=true \
  --env PLAYWRIGHT_WORKERS="${PLAYWRIGHT_WORKERS:-5}"\
  --env PLAYWRIGHT_RETRIES=1\
  --env PLAYWRIGHT_SHARD="${PLAYWRIGHT_SHARD-}"\
  --env PLAYWRIGHT_SHARDS_AMOUNT="${PLAYWRIGHT_SHARDS_AMOUNT-}"\
  playwright-image
  end_gh_actions_group

  clean
}

main "$@"

