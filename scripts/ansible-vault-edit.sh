#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

function main {
  # check absible-command docker run to see how vaults & configs are mapped
  # e.g. configs are under /servers/config/
  # Examples because I always have to use 30 min to figure out where is what:
  # Prod vault:
  # scripts/ansible-vault-edit.sh /servers/group_vars/va_app_prod/vault.yml
  # Prod configs:
  # scripts/ansible-vault-edit.sh /servers/config/secret-va-prod-vault.edn

  local VAULT_FILE="$1"

  ansible-vault edit "$VAULT_FILE" --vault-password-file=/servers/gpg-wrapper.sh
}

main "$@"
