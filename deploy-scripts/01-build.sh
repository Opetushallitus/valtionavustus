#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

readonly github_registry="ghcr.io/opetushallitus"

function main {
  require_command docker
  require_docker_compose

  cd "$repo"

  local tags_to_push=()

  local image_tag="$github_registry/va-server:${GITHUB_SHA:-$(git rev-parse HEAD)}"

  info "Building $image_tag"
  export VA_SERVER_TAG="$image_tag"
  docker compose build --pull va-server
  tags_to_push+=("$image_tag")


  if [ -n "${GITHUB_REF_NAME:-}" ]; then
    readonly ref_tag="$github_registry/va-server:$GITHUB_REF_NAME"
    info "Tagging as $ref_tag"
    docker tag "$image_tag" "$ref_tag"
    tags_to_push+=("$ref_tag")
  fi


  if [ "${GITHUB_ACTIONS:-}" == "true" ]; then
    info "Pushing tags"
    for tag in "${tags_to_push[@]}"
    do
      info "docker push $tag"
      docker push "$tag"
    done
  else
    info "Not pushing tags when running locally"
  fi
}

function require_docker_compose {
  docker compose > /dev/null || fatal "docker compose missing"
}

main
