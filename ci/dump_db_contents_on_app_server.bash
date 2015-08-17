#!/bin/bash
set -euo pipefail

if [ -z ${1+x} ]; then
  echo "Usage: $0 <comma-separated list of database servers> [path where dump will be stored]"
  exit 3
fi

comma_separated_server_list=$1

ephemeral_disk_mount_point=/mnt
dumps_directory=${ephemeral_disk_mount_point}/db-dumps
mkdir -p ${dumps_directory}

copy_target=${ephemeral_disk_mount_point}/database-backup/${timestamp}

SSH_KEY=~/.ssh/id_deploy
SSH_USER=postgres

for server in ${comma_separated_server_list//,/ }
do
  if [ -z ${2+x} ]; then
    dump_target="${dumps_directory}/${server}-`date +'%Y%m%d%H%M%S'`.sql"
  else
    dump_target=$2
  fi

  dump_command="/usr/bin/ssh -i ${SSH_KEY} ${SSH_USER}@${server} /usr/local/bin/dump_database_to_sql.bash > ${dump_target}"
  echo "Running $dump_command"
  time eval ${dump_command}
  echo "Got: `du -hsx ${dump_target}`"
done
