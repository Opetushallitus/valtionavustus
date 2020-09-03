#!/usr/bin/env bash

command -v tmux > /dev/null 2>&1 || { echo >&2 "I require tmux but it's not installed. Aborting."; exit 1; }
command -v nc > /dev/null 2>&1 || { echo >&2 "I require nc but it's not installed. Aborting."; exit 1; }

JAVA_VERSION="$(java -version 2>&1 >/dev/null | grep 'openjdk version' | awk '{print $3}' | sed 's/"//g' )"
if [[ "$JAVA_VERSION" != "1.8.0_"* ]]; then
  echo "Missing required openjdk version 1.8.0_*"
  exit 1;
fi

session="valtionavustus"

tmux kill-session -t $session
tmux start-server
tmux new-session -d -s $session

tmux splitw -h
tmux splitw -h

tmux select-pane -t 0
tmux send-keys "./run_database.sh" C-m


echo "waiting for database to accept connections"
until pg_isready -h localhost -p 5432 -U postgres
do
  sleep 2;
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

