#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./deploy-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/deploy-functions.sh"

trap clean EXIT

readonly RESULTS_DIR="$repo/playwright-results"
compose="docker-compose -f docker-compose.yml -f docker-compose-playwright.yml"

function clean {
  $compose down
}

function main {
  start_gh_actions_group "Setup"
  require_command docker
  require_docker_compose
  require_built_image
  end_gh_actions_group

  mkdir -p "$RESULTS_DIR"
  export VA_SERVER_IMAGE="$image_tag"
  info "Using $image_tag"

  start_gh_actions_group "Pull and build images required for playwright tests"
  $compose build db fakesmtp maksatuspalvelu
  docker build -t playwright-image -f Dockerfile.playwright-test-runner --build-arg "PLAYWRIGHT_VERSION=${PLAYWRIGHT_VERSION}" .
  end_gh_actions_group

  start_gh_actions_group "Start services"
  $compose up --no-build --wait va
  end_gh_actions_group

  start_gh_actions_group "run playwright tests"
  docker run --rm --network valtionavustus-playwright_default \
  -v "$RESULTS_DIR":/playwright-results\
  --init \
  --ipc=host \
  --env TZ='Europe/Helsinki'\
  --env VIRKAILIJA_HOSTNAME=va\
  --env HAKIJA_HOSTNAME=va\
  --env HEADLESS=true \
  --env PLAYWRIGHT_WORKERS="${PLAYWRIGHT_WORKERS:-5}"\
  --env PLAYWRIGHT_RETRIES=1\
  --env PLAYWRIGHT_SHARD="${PLAYWRIGHT_SHARD-}"\
  --env PLAYWRIGHT_SHARDS_AMOUNT="${PLAYWRIGHT_SHARDS_AMOUNT-}"\
  --env GITHUB_SHA \
  --env GITHUB_SERVER_URL \
  --env GITHUB_REPOSITORY \
  --env GITHUB_RUN_ID \
  playwright-image \
  "$@"

  end_gh_actions_group

  clean
}

main "$@"

