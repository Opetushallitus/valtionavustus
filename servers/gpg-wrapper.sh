#!/usr/bin/env bash
script_location=$( cd "$( dirname "$0" )" && pwd )

VAULT_PW_FILENAME="$script_location/va-secrets.gpg"
gpg --quiet --batch --use-agent --decrypt $VAULT_PW_FILENAME
