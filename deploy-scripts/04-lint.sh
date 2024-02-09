#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./deploy-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/deploy-functions.sh"

function main {
    cd "$repo"

    start_gh_actions_group "Setup"
    init_nodejs
    npm_ci_if_package_lock_has_changed
    end_gh_actions_group
    
    start_gh_actions_group "prettier"
    npm run prettier-check-project
    end_gh_actions_group
}

main "$@"
