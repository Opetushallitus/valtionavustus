#!/bin/bash
KEY_FILE=~/.ssh/pouta-`whoami`.pem
pouta-venv/bin/nova keypair-add `whoami` > $KEY_FILE
chmod 600 $KEY_FILE
