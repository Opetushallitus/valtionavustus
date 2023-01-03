CREATE TABLE tasmaytysraportti (
  id                serial PRIMARY KEY,
  avustushaku_id    integer NOT NULL,
  contents          bytea NOT NULL,
  mailed_at         timestamp NOT NULL,
  mailed_to         text NOT NULL
);
