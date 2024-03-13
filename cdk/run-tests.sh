#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

function main {
  cd "$repo/cdk"
  init_nodejs_cdk
  
  node --import tsx --test "$@" tests/*.test.ts
}

main "$@"
