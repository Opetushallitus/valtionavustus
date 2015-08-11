#!/bin/bash
set -euo pipefail

if [ -z ${2+x} ]; then
  echo "Usage: $0 <database server> <backup location on server>"
  exit 3
fi

database_server=$1
backups_path_on_server=$2

timestamp=`date +'%Y%m%d%H%M%S'`
ephemeral_disk_mount_point=/mnt
copy_target=${ephemeral_disk_mount_point}/database-backup/${timestamp}
mkdir -p ${copy_target}

SSH_KEY=~/.ssh/id_deploy
SSH_USER=va-deploy

copy_command="scp -Cpr -i ${SSH_KEY} ${SSH_USER}@${database_server}:${backups_path_on_server} ${copy_target}"
echo "Running $copy_command"
time eval ${copy_command}
