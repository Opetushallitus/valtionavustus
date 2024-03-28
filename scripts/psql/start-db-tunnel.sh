#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

## FIXME: Ensure user has logged in
## FIXME: Ensure user has AWS_PROFILE set up

docker-compose up --build
