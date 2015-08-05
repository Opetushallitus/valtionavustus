#!/bin/bash
set -euo pipefail

if [ -z ${1+x} ]; then
  echo "Usage: $0 <comma-separated list of target servers> <other commands>"
  exit 3
fi

comma_separated_server_list=$1
postgresql_host_port=5432

for server in ${comma_separated_server_list//,/ }
do
  echo "========================="
  echo "Deploying on $server: "
  command_line="`dirname $0`/cibuild.bash -r -s $server -p $postgresql_host_port {@:2}"
  echo "Executing :"
  echo $command_line

  eval $command_line
done
