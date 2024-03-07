#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

docker-compose up --build
