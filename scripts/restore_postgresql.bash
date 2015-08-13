#!/bin/bash
set -euo pipefail

# Warning: This script does pretty drastic things
# and makes a lot of assumptions. Study it with care
# and amend as needed before attempting to use.

if [ -z "${2+x}" ]; then
  echo "Usage: $0 <source directory of db backup> <directory of wal files after last backup>"
  exit 2
fi

restore_source_dir=$1
directory_with_wal_files_to_restore=$2

if [ ! -d $restore_source_dir ]; then
  echo "$restore_source_dir does not look like an existing directory."
  ls -l $restore_source_dir
  exit 3
fi

if [ ! -f $restore_source_dir/PG_VERSION ]; then
  echo "Looks like $restore_source_dir/PG_VERSION is not a file, "
  echo "maybe $restore_source_dir is not a correct PG backup location?"
  echo "Are you sure you can access it?"
  exit 4
fi

# This is the 9.4 default but must be updated if it changes.
postgres_data_dir=/var/lib/postgresql/9.4/main
xlog_dir=$postgres_data_dir/pg_xlog

if [ ! -d $postgres_data_dir ]; then
  echo "Looks like $postgres_data_dir is not a directory, "
  echo "maybe $postgres_data_dir is not a correct PG location?"
  echo "Are you sure you can access it?"
  exit 5
fi

postgres_user=postgres
postgres_group=postgres

function copy_data_dir_to_tmp() {
  echo "Attempting safety copy of existing data"
  backup_target=/tmp/postgres-data-copy.tar.gz
  du -hsx $postgres_data_dir
  time tar czf $backup_target $postgres_data_dir
  du -hsx $backup_target
}

service postgresql stop
copy_data_dir_to_tmp
rm -rf $postgres_data_dir/*

cp -a $restore_source_dir/* $postgres_data_dir/
mkdir -p $xlog_dir
rm -rf $xlog_dir/*
chown -R $postgres_user:$postgres_group $postgres_data_dir

mkdir -p /tmp/all_wals
rm -rf /tmp/all_wals/*
cp -a $restore_source_dir/wal/* /tmp/all_wals/
cp -a $directory_with_wal_files_to_restore/* /tmp/all_wals/

recovery_conf=$postgres_data_dir/recovery.conf
restore_command="cp /tmp/all_wals/%f %p"
echo "restore_command = '${restore_command}'" > $recovery_conf
echo "Wrote recovery.conf : "
echo "======== $recovery_conf begins =========="
cat $recovery_conf
echo "======== $recovery_conf ends ============"

echo "PostgreSQL might be ready to restore backups now."
du -hsx $postgres_data_dir

