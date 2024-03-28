#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

## FIXME: Ensure user has logged in

docker-compose up --build
