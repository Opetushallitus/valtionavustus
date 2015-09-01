CREATE TYPE role AS ENUM ('presenting_officer', 'evaluator');

CREATE TABLE avustushaku_roles (
   id             serial PRIMARY KEY,
   avustushaku    integer REFERENCES avustushaut(id) NOT NULL,
   created_at     timestamp with time zone default now(),
   name           VARCHAR(128) NOT NULL,
   email          VARCHAR(128) NOT NULL,
   role           role NOT NULL
);

INSERT INTO avustushaku_roles (avustushaku, name, email, role) VALUES (1, 'Leena Koski', 'leena.koski@oph.fi', 'presenting_officer')
