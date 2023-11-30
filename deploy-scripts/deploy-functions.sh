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
readonly image_tag="$github_registry:${revision}"
readonly deploy_dist_dir="$repo/deploy-scripts/dist/"
mkdir -p "$deploy_dist_dir"

readonly standalone_jar_name="valtionavustus-standalone-$revision.jar"

function image_exists_locally {
  local tag="$1"
  docker image inspect "$tag" &> /dev/null
}

function require_built_image {
  if image_exists_locally "$image_tag"; then
    info "$image_tag already exists locally"
  else
    info "Pulling $image_tag because it does not exist locally"
    docker pull "$image_tag"
  fi
}
