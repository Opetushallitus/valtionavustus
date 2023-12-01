#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

function install_docker_compose {
  info "Installing docker compose"
  curl -L "https://github.com/docker/compose/releases/download/v2.17.0/docker-compose-$(uname -s)-$(uname -m)" -o "$repo/scripts/docker-compose"
  chmod u+x "$repo/scripts/docker-compose"
  "$repo/scripts/docker-compose" --version
}

function remove_all_files_ignored_or_untracked_by_git {
  git clean -xdf
}
