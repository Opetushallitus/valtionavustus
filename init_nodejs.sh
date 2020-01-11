node_version="12.13.1"
npm_version="6.13.4"

export NVM_DIR="${NVM_DIR:-$HOME/.cache/nvm}"
. ./nvm.sh
nvm use "${node_version}" || nvm install "${node_version}"
npm install -g "npm@${npm_version}"

export NODE_PATH=$NVM_DIR/v$node_version/lib/node_modules
export PATH=$NVM_DIR/versions/node/v$node_version/bin:$PATH
