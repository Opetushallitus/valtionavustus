#!/bin/bash
if [ -z $1 ]; then
  echo "Usage: $0 <IP address where to go> [other parameters]"
  exit 2
fi
TARGET_HOST=$1
shift
ssh -F ssh.config $TARGET_HOST $@
