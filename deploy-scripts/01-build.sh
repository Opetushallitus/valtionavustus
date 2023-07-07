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
  docker build --tag "$image_tag" "$repo"
  tags_to_push+=("$image_tag")
  end_gh_actions_group

  if [ -n "${GITHUB_REF_NAME:-}" ]; then
    readonly ref_tag="$github_registry:$GITHUB_REF_NAME"
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

  build_jar
}

function build_jar {
  start_gh_actions_group "lein uberjar"

  info "lein uberjar"
  readonly uberjar_container="va-server-uberjar"
  docker rm $uberjar_container || true
  docker compose run \
    --name "$uberjar_container" \
    $service_name \
    uberjar
  docker cp \
    "$uberjar_container:/app/target/uberjar/valtionavustus-0.1.0-SNAPSHOT-standalone.jar" \
    "$standalone_jar"

  end_gh_actions_group
}

main
