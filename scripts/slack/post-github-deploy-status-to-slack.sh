#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/common-functions.sh"

function main {
  init_nodejs
  ## We can remove "--experimental-fetch" flag once we get rid of old Node 16
  npx tsx --experimental-fetch "${repo}/scripts/slack/post-github-deploy-status-to-slack.ts"
}

main "$@"
