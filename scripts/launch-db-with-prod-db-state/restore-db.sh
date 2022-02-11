#!/bin/sh

PGPASSWORD=va pg_restore --verbose --no-owner -U va -d va-dev /var/tmp/valtionavustukset.backup
