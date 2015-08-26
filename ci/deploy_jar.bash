#!/bin/bash
set -euo pipefail

if [ -z ${1+x} ]; then
  echo "Usage: $0 <comma-separated list of target servers> [source jar path]"
  exit 3
fi

if [ -z ${2+x} ]; then
  va_hakija_source_path=../../valtionavustus-deploy-test/builds/lastStableBuild/archive/va-hakija/target/uberjar/va-hakija-*-standalone.jar
else
  va_hakija_source_path=$2
fi

comma_separated_server_list=$1

for server in ${comma_separated_server_list//,/ }
do
  echo "========================="
  echo "Deploying $va_hakija_source_path on $server: "
  command_line="`dirname $0`/cibuild.bash -s $server -j $va_hakija_source_path deploy"
  echo "Executing :"
  echo $command_line

  eval $command_line
done
