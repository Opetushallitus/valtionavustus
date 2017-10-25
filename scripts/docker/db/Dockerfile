FROM postgres:9.4
COPY ./db.sql /docker-entrypoint-initdb.d/db.sql
COPY ./users.sql /docker-entrypoint-initdb.d/users.sql
COPY ./set_config.sh /docker-entrypoint-initdb.d/set_config.sh
