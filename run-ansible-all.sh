#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

function main {
  ./run-ansible-jenkins.sh "$@"
  ./run-ansible-loadbalancer.sh "$@"
  ./run-ansible-qa .sh "$@"
  ./run-ansible-prod.sh "$@"
}

main "$@"
