#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./deploy-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/deploy-functions.sh"

readonly service_name="va-server"

function main {
  require_command docker
  require_docker_compose

  cd "$repo"

  local tags_to_push=()

  start_gh_actions_group "Building $image_tag"
  export VA_SERVER_TAG="$image_tag"
  docker build \
      --build-arg "REVISION=${revision}" \
      --build-arg "NODE_VERSION=${NODE_VERSION}" \
      --tag "$image_tag" \
      --file Dockerfile.va-app \
      "$repo"

  tags_to_push+=("$image_tag")
  end_gh_actions_group

  if [ -n "${GITHUB_REF_NAME:-}" ]; then
    # Github refs often have slashes, which are not allowed in tag names
    # https://github.com/opencontainers/distribution-spec/blob/main/spec.md#pulling-manifests
    readonly clean_ref_name="${GITHUB_REF_NAME//[!a-zA-Z0-9._-]/-}"
    readonly ref_tag="$github_registry:$clean_ref_name"
    info "Tagging as $ref_tag"
    docker tag "$image_tag" "$ref_tag"
    tags_to_push+=("$ref_tag")
  fi

  if running_on_gh_actions; then
    start_gh_actions_group "Pushing tags"
    for tag in "${tags_to_push[@]}"
    do
      info "docker push $tag"
      docker push "$tag"
    done
    end_gh_actions_group
  else
    info "Not pushing tags when running locally"
  fi
}

main
