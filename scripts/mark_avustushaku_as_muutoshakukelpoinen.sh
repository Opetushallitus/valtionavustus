#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

function main {
  if [[ $# -lt 2 ]]; then
    echo "USAGE: $0 qa 666"
    exit 0
  fi

  local -r env="$1"
  local -r avustushaku_id="$2"

  info "Before"
  "${repo}/scripts/psql-${env}.sh" <<EOF
    begin;
    select id, muutoshakukelpoinen from avustushaut where id = ${avustushaku_id};
    update avustushaut set muutoshakukelpoinen = true where id = ${avustushaku_id};
    select id, muutoshakukelpoinen from avustushaut where id = ${avustushaku_id};
    commit;
EOF
}

main "$@"
