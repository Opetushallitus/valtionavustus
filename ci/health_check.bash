#!/bin/bash

if [ -z $5 ]; then
  echo "Usage: $0 <ssh-user> <ssh-key> <target machine name> <port where app will listen> <command to cat latest log for debugging>"
  exit 3
fi

ssh_user=$1
ssh_key=$2
target_machine=$3
application_port=$4
cat_log_command=${@:5}

TEST_URL="http://localhost:$application_port/api/healthcheck"
ATTEMPTS=40
PAUSE_SECONDS=3

function cat_latest_application_log() {
  echo
  echo "*** Latest application log (by $cat_log_command ): ***"
  eval $cat_log_command
  echo "*** /Latest application log ends *********************"
  echo
}

for N in `seq 1 $ATTEMPTS`; do
  ssh -i $ssh_key $ssh_user@$target_machine "/usr/bin/curl --fail --connect-timeout 10 --max-time 20 $TEST_URL"
  if [ 0 -eq $? ]; then
    echo
    echo "At `date`, application seems to be up at $TEST_URL , great!"
    cat_latest_application_log
    exit 0
  fi
  echo
  echo "    ...no dice yet, sleeping for $PAUSE_SECONDS seconds and trying again..."
  sleep $PAUSE_SECONDS
done

echo "Giving up at `date` ."
echo "Could not get OK response from $TEST_URL with $ATTEMPTS attempts with $PAUSE_SECONDS second intervals, what's wrong?"
cat_latest_application_log
exit 2
