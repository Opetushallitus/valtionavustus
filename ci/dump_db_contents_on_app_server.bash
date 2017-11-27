#!/bin/bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
    echo "Usage: $0 <comma-separated_list_of_database_servers> <dumps_dir>"
    exit 3
fi

COMMA_SEPARATED_SERVER_LIST=$1
DUMPS_DIR=$2

SSH_KEY=~/.ssh/id_deploy
SSH_USER=postgres

make_dump() {
    local server=$1
    local dump_file="${DUMPS_DIR}/${server}-`date +'%Y%m%d%H%M%S'`.customdump"
    local dump_cmd="/usr/bin/ssh -i \"$SSH_KEY\" \"$SSH_USER@$server\" /usr/local/bin/dump_database_to_sql.bash > $dump_file"

    echo "Running on $server: $dump_cmd"
    time eval "$dump_cmd"
    echo "Dump complete."
}

find "$DUMPS_DIR" \
     -mindepth 1 \
     -maxdepth 1 \
     -mtime +24 \
     -exec echo 'Removing old dump: {}' \; \
     -exec rm -f -- '{}' \;

for server in ${COMMA_SEPARATED_SERVER_LIST//,/ }; do
    make_dump "$server"
done
