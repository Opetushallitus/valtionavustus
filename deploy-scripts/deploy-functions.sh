#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# allow sourcing this file multiple times from different scripts
if [ -n "${DEPLOY_FUNCTIONS_SOURCED:-}" ]; then
  return
fi
readonly DEPLOY_FUNCTIONS_SOURCED="true"

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

readonly github_registry="ghcr.io/opetushallitus/va-server"
readonly revision="${GITHUB_SHA:-$(git rev-parse HEAD)}"
readonly image_tag="$github_registry:$revision"
readonly deploy_dist_dir="$repo/deploy-scripts/dist/"
mkdir -p "$deploy_dist_dir"

readonly standalone_jar="$deploy_dist_dir/valtionavustus-standalone-$revision.jar"
