CREATE TABLE application_tokens (
  id             SERIAL PRIMARY KEY,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT now(),
  application_id INTEGER NOT NULL,
  token          VARCHAR(64) NOT NULL,
  revoked        BOOLEAN);

CREATE SEQUENCE application_id_seq;
CREATE INDEX ON application_tokens (token);
