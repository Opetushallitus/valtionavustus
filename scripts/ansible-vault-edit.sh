#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/ansible-common-functions.sh"

function main {
  local VAULT_FILE="$1"
  install_python_and_dependencies

  ansible-vault edit "$VAULT_FILE" --vault-password-file="$repo/servers/gpg-wrapper.sh"
}

main "$@"