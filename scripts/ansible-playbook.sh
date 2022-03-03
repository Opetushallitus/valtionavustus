#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"
readonly local_docker_namespace="valtionavustus"
readonly python_version="3.9.5"
readonly ansible_version="4.6.0"

function main {
  require_docker
  ansible-playbook "$@"
}

function ansible-playbook {
  local -r image="${local_docker_namespace}/ansible-playbook"
  local -r tag="${python_version}-${ansible_version}"

  if ! docker image inspect ${image}:${tag} > /dev/null; then
    docker build "$repo/scripts" \
      --file "$repo/scripts/Dockerfile.ansible-vault" \
      --build-arg PYTHON_VERSION="${python_version}" \
      --build-arg ANSIBLE_VERSION="${ansible_version}" \
      --tag ${image}:${tag}
  fi

  docker run \
    --rm -it --volume "$(pwd):/ansible" ${image}:${tag} "$@"
}

main "$@"
