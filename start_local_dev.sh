#!/usr/bin/env bash

command -v tmux > /dev/null 2>&1 || { echo >&2 "I require tmux but it's not installed. Aborting."; exit 1; }
command -v nc > /dev/null 2>&1 || { echo >&2 "I require nc but it's not installed. Aborting."; exit 1; }

session="valtionavustus"

tmux start-server
tmux new-session -d -s $session

tmux splitw -h
tmux splitw -h

tmux select-pane -t 0
tmux send-keys "./run_database.sh" C-m

while ! nc -z localhost 5432; do
  sleep 1
done

tmux splitw -v
tmux send-keys "./run_admin_ui.sh" C-m

tmux select-pane -t 2
tmux send-keys "./run_hakija_server.sh" C-m

tmux splitw -v
tmux send-keys "./run_hakija_frontend.sh" C-m

tmux select-pane -t 4
tmux send-keys "./run_virkailija_server.sh" C-m

tmux splitw -v
tmux send-keys "./run_virkailija_frontend.sh" C-m

tmux select-pane -t 0
tmux attach-session -t $session
