#!/bin/bash
set -euo pipefail

if [ -z ${2+x} ]; then
  echo "Usage: $0 <comma-separated list of database servers> <path where dump will be stored>"
  exit 3
fi

comma_separated_server_list=$1
dumps_directory=$2

SSH_KEY=~/.ssh/id_deploy
SSH_USER=postgres

for server in ${comma_separated_server_list//,/ }
do
  dump_target="${dumps_directory}/${server}-`date +'%Y%m%d%H%M%S'`.sql"
  dump_command="/usr/bin/ssh -i ${SSH_KEY} ${SSH_USER}@${server} /usr/local/bin/dump_database_to_sql.bash > ${dump_target}"
  echo "Running $dump_command"
  time eval ${dump_command}
  echo "Got: `du -hsx ${dump_target}`"
done
