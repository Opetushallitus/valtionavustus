#!/usr/bin/env bash

set -euo pipefail

function cd_project_root_dir() {
  local script_dir=$(dirname "$0")
  cd "$script_dir/.." || exit 3
}

cd_project_root_dir

function show_usage() {
  cat << EOF
Usage: ${0##*/}
EOF
  exit 2
}

show_tool_versions() {
    echo "npm: $(npm --version)"
    echo "lein: $(./lein --version)"
}

if [ "$#" -lt 1 ]; then
    show_usage
fi

commands=()
while [[ $# > 0 ]]; do
  key="$1"

  case $key in
      *)
      # unknown option
      show_usage
      ;;
  esac
  shift # past command or argument value
done

show_tool_versions

for (( i = 0; i < ${#commands[@]} ; i++ )); do
    printf "\n**** ${commands[$i]} *****\n\n"
    eval "${commands[$i]}"
done
