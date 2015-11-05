#!/usr/bin/env bash

DOCKER=/usr/bin/docker
if [ ! -x $DOCKER ]; then
  DOCKER=/usr/local/bin/docker
fi

if [ -z ${host_postgres_port+x} ]; then
  host_postgres_port=15432
fi
container_postgres_port=5432

function start_postgresql_in_container() {
  time $DOCKER pull sameersbn/postgresql:9.4 || true
  echo "Checking if postgresql container is running already:"
  is_container_running=`docker inspect -f {{.State.Running}} postgresql || true`
  if [ "$is_container_running" == true ]; then
    echo "Warning: found running postgresql container, stopping it."
    remove_postgresql_container
  fi
  time $DOCKER run --name postgresql -d -p $host_postgres_port:$container_postgres_port -e 'DB_USER=va_hakija' -e 'DB_PASS=va' -e 'DB_NAME="va-test"' sameersbn/postgresql:9.4
}

function store_sql_script_to_container() {
  command=$1
  script_path=$2
  echo "echo \"${command}\" | sudo -u postgres psql -d va-test -f -" | $DOCKER exec -i postgresql /bin/bash -c "cat > $script_path"
}

function exec_in_container() {
  script_path=$1
  $DOCKER exec postgresql bash -e $script_path
}

function wait_for_postgresql_to_be_available() {
  echo "Waiting for psql to be able to connect to database..."
  attempt=0
  max_attempts=60
  interval_seconds=3.0

  store_sql_script_to_container "select 1;" /tmp/poll_psql.bash
  until (exec_in_container /tmp/poll_psql.bash) || [[ $attempt -ge $max_attempts ]] ; do
    echo "  Waiting for Postgresql to be available in the container , attempt $attempt/$max_attempts ..."
    sleep $interval_seconds
    attempt=$(( $attempt + 1 ))
  done
  if [ $attempt -eq $max_attempts ]; then
    echo "Could not find running Postgresql in $max_attempts attempts with $interval_seconds second intervals, failing."
    logs_command="$DOCKER logs postgresql"
    echo "Running $logs_command : ============"
    eval ${logs_command}
    echo "======= / end of ${logs_command} output"
    remove_postgresql_container
    exit 2
  fi
}

function give_schema_to_va() {
  store_sql_script_to_container "alter schema $1 owner to va_hakija;" /tmp/give_schema_to_va.bash
  exec_in_container /tmp/give_schema_to_va.bash
}

function create_va_virkailija_user() {
  store_sql_script_to_container "create user va_virkailija with password 'va'; grant create on database \\\"va-test\\\" to va_virkailija; " /tmp/create_va_virkailija.bash
  exec_in_container /tmp/create_va_virkailija.bash
}

function remove_postgresql_container() {
  $DOCKER stop postgresql
  $DOCKER rm -v postgresql
}
