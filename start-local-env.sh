#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

compose="docker compose -f docker-compose.yml"
if [ -d "$repo/../valtionavustus-secret/" ]; then
  compose="$compose -f docker-compose.with-secret.yml"
fi
compose="$compose -f docker-compose.local-dev.yml"
readonly compose

function stop() {
  $compose down --remove-orphans || true
}
trap stop EXIT

function init {
  require_command tmux
  require_docker
}

function rename_panes_to_match_the_script_they_run {
  tmux select-pane -t 0 -T run_database
  tmux select-pane -t 1 -T run_frontend
  tmux select-pane -t 2 -T run_hakija_server
  tmux select-pane -t 3 -T run_fakesmtp
  tmux select-pane -t 5 -T run_maksatuspalvelu
}

init

$compose pull
$compose create db hakija virkailija fakesmtp maksatuspalvelu

session="valtionavustus"

tmux kill-session -t $session || true
tmux start-server
tmux new-session -d -s $session -c "$repo"

tmux splitw -h
tmux splitw -h

readonly up_cmd="$compose up --no-log-prefix --build"

tmux select-pane -t 0
tmux send-keys "$up_cmd db" C-m

tmux splitw -v
tmux send-keys "$repo/scripts/run_frontend.sh" C-m

tmux select-pane -t 2
tmux send-keys "$up_cmd hakija" C-m

tmux splitw -v
tmux send-keys "$up_cmd fakesmtp" C-m


tmux splitw
tmux send-keys "$up_cmd maksatuspalvelu" C-m

rename_panes_to_match_the_script_they_run

tmux select-pane -t 0
tmux attach-session -t $session
