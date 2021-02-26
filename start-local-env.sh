#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

function stop() {
  "$repo/scripts/stop_database.sh"
  pushd "$repo/fakesmtp"
  docker-compose down || true
  popd
}
trap stop EXIT

require_command tmux
require_command nc
require_command docker

docker ps > /dev/null 2>&1 || { echo >&2 "Running 'docker ps' failed. Is docker daemon running? Aborting."; exit 1; }

session="valtionavustus"

tmux kill-session -t $session || true
tmux start-server
tmux new-session -d -s $session

tmux splitw -h
tmux splitw -h

tmux select-pane -t 0
tmux send-keys "$repo/scripts/run_database.sh" C-m

tmux splitw -v
tmux send-keys "$repo/scripts/run_admin_ui.sh" C-m

tmux select-pane -t 2
tmux send-keys "$repo/scripts/run_hakija_server.sh" C-m

tmux splitw -v
tmux send-keys "$repo/scripts/run_frontend.sh" C-m

tmux select-pane -t 4
tmux send-keys "$repo/scripts/run_virkailija_server.sh" C-m

tmux splitw
tmux send-keys "$repo/scripts/run_fakesmtp.sh" C-m

tmux select-pane -t 0
tmux attach-session -t $session

