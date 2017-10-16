#!/usr/bin/env bash

echo "building valtionavustus"
make clean
make test
make build
