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

RESTORE_FILE=""
RUN_DATABASE_ARGS=""

while getopts "r:" opt
do
    case $opt in
    (r) RUN_DATABASE_ARGS="-r"; RESTORE_FILE="$OPTARG" ;;
    (*) printf "Illegal option '-%s'\n" "$opt" && exit 1 ;;
    esac
done

require_command tmux
require_command nc
require_command docker
init_nodejs

docker ps > /dev/null 2>&1 || { echo >&2 "Running 'docker ps' failed. Is docker daemon running? Aborting."; exit 1; }

session="valtionavustus"

tmux kill-session -t $session || true
tmux start-server
tmux new-session -d -s $session

tmux splitw -h
tmux splitw -h

tmux select-pane -t 0
tmux send-keys "$repo/scripts/run_database.sh ${RUN_DATABASE_ARGS}" C-m

tmux splitw -v
tmux send-keys "$repo/scripts/run_frontend.sh" C-m

tmux select-pane -t 2
tmux send-keys "$repo/scripts/run_hakija_server.sh" C-m

tmux splitw -v
tmux send-keys "$repo/scripts/run_fakesmtp.sh" C-m

tmux select-pane -t 4
tmux send-keys "$repo/scripts/run_virkailija_server.sh" C-m

tmux splitw
tmux send-keys "$repo/scripts/run_maksatuspalvelu.sh" C-m

if [ ! -z $RESTORE_FILE ]; then
  tmux new-window
  tmux send-keys "$repo/scripts/restore_dump.sh $RESTORE_FILE" C-m
fi

#rename panes to match the script they run
tmux select-pane -t 0 -T run_database
tmux select-pane -t 1 -T run_frontend
tmux select-pane -t 2 -T run_hakija_server
tmux select-pane -t 3 -T run_fakesmtp
tmux select-pane -t 4 -T run_virkailija_server
tmux select-pane -t 5 -T run_maksatuspalvelu

tmux select-pane -t 0
tmux attach-session -t $session
