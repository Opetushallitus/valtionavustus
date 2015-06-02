#!/bin/bash
KEY_FILE=~/.ssh/pouta-`whoami`.pem
pouta-venv/bin/nova keypair-add `whoami` > $KEY_FILE
chmod 600 $KEY_FILE
BACKUP_FILE=~/.ssh/id_ecdsa-pre-`date +'%Y%m%d%H%M%S'`
touch ~/.ssh/id_ecdsa
echo "Moving ~/.ssh/id_ecdsa to $BACKUP_FILE"
mv -if ~/.ssh/id_ecdsa $BACKUP_FILE
echo "Linking $KEY_FILE to ~/.ssh/id_ecdsa so that ssh client will use it automatically"
ln -s $KEY_FILE ~/.ssh/id_ecdsa