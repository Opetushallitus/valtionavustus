readonly repo="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )"

readonly node_version="12.13.1"
readonly npm_version="6.13.4"

function init_nodejs {
  export NVM_DIR="${NVM_DIR:-$HOME/.cache/nvm}"
  source "$repo/nvm.sh"
  nvm use "${node_version}" || nvm install "${node_version}"
  npm install -g "npm@${npm_version}"
}
