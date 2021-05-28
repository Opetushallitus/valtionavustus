#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
scriptdir="$( cd "$( dirname "$0" )" && pwd )"
source "${scriptdir}/common-functions.sh"

BACKUP_FILE=$1

wait_for_container_to_be_healthy va-postgres

export PGPASSWORD=va
export PGUSER=va
export PGPORT=42042
export PGHOST=localhost

pg_restore --dbname=va-restore --no-owner --verbose $BACKUP_FILE
psql --dbname postgres -c 'ALTER DATABASE va-restore RENAME TO va-dev'
