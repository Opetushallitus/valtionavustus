#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

function main {
  # check absible-command docker run to see how vaults & configs are mapped
  # e.g. configs are under /servers/config/

  local VAULT_FILE="$1"

  ansible-vault edit "$VAULT_FILE" --vault-password-file=/servers/gpg-wrapper.sh
}

main "$@"
