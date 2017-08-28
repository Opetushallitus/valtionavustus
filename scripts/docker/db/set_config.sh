#!/bin/sh

# cp /docker-entrypoint-initdb.d/custom.conf /var/lib/postgresql/data/postgresql.conf
echo "log_destination = 'stderr'" >> /var/lib/postgresql/data/postgresql.conf
echo "log_line_prefix = '%t %u '" >> /var/lib/postgresql/data/postgresql.conf
echo "log_statement = 'mod'" >> /var/lib/postgresql/data/postgresql.conf

