#!/usr/bin/env bash
va_hakija_default_source_path="va-hakija/target/uberjar/hakija-*-standalone.jar"
va_virkailija_default_source_path="va-virkailija/target/uberjar/virkailija-*-standalone.jar"

echo "building valtionavustus"
make clean
make build

echo "building admin-ui frontend"
lein clean
lein package
