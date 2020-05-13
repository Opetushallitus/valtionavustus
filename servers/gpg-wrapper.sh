#!/usr/bin/env bash

VAULT_PW_FILENAME="va-secrets.gpg"
gpg --quiet --batch --use-agent --decrypt $VAULT_PW_FILENAME
