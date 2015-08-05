#!/bin/bash

if [ -z $1 ]; then
  echo "Usage: $0 <target machine name>"
  exit 3
fi

target_machine=$1

TEST_URL="http://$target_machine:8081/"
ATTEMPTS=20
PAUSE_SECONDS=3

for N in `seq 1 $ATTEMPTS`; do
  /usr/bin/curl --connect-timeout 10 --max-time 20 $TEST_URL
  if [ 0 -eq $? ]; then
    echo "At `date`, application seems to be up at $TEST_URL , great!"
    exit 0
  fi
  echo "    ...no dice yet, sleeping for $PAUSE_SECONDS seconds and trying again..."
  sleep $PAUSE_SECONDS
done

echo "Giving up at `date` ."
echo "Could not get OK response from $TEST_URL with $ATTEMPTS attempts with $PAUSE_SECONDS second intervals, what's wrong?"
exit 2