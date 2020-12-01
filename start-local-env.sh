#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

repodir=$( cd "$( dirname "$0" )" && pwd )
scriptdir="$repodir/scripts"

function stop() {
  ./scripts/stop_database.sh
}
trap stop EXIT

function require() {
  local cmd=$1
  command -v ${cmd} > /dev/null 2>&1 || { echo >&2 "I require ${cmd} but it's not installed. Aborting."; exit 1; }
}

require tmux
require nc
require docker

docker ps > /dev/null 2>&1 || { echo >&2 "Running 'docker ps' failed. Is docker daemon running? Aborting."; exit 1; }

session="valtionavustus"

tmux kill-session -t $session || true
tmux start-server
tmux new-session -d -s $session

tmux splitw -h
tmux splitw -h

tmux select-pane -t 0
tmux send-keys "$scriptdir/run_database.sh" C-m

echo "waiting for database to accept connections"
until [ "$(docker inspect -f {{.State.Health.Status}} va-postgres 2>/dev/null || echo "not-running")" == "healthy" ]; do
  sleep 2;
done;

tmux splitw -v
tmux send-keys "$scriptdir/run_admin_ui.sh" C-m

tmux select-pane -t 2
tmux send-keys "$scriptdir/run_hakija_server.sh" C-m

tmux splitw -v
tmux send-keys "$scriptdir/run_frontend.sh" C-m

tmux select-pane -t 4
tmux send-keys "$scriptdir/run_virkailija_server.sh" C-m

tmux select-pane -t 0
tmux attach-session -t $session

