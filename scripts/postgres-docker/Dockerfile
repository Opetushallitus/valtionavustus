# Based on <https://hub.docker.com/_/postgres/>

FROM postgres:9.4

COPY ./init-db.sql /docker-entrypoint-initdb.d/
COPY ./configure-postgres.sh /docker-entrypoint-initdb/
