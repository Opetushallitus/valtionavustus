#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

RESTORE_FILE=$1
$repo/start-local-env.sh -r $RESTORE_FILE
