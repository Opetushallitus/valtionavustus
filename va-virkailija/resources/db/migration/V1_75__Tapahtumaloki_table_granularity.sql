DROP TABLE IF EXISTS tapahtumaloki;

CREATE TABLE tapahtumaloki (
  id              serial PRIMARY KEY,
  tyyppi          VARCHAR(32) NOT NULL,
  created_at      timestamp with time zone NOT NULL DEFAULT now(),
  avustushaku_id  integer NOT NULL,
  hakemus_id      integer NOT NULL,
  batch_id        VARCHAR(64) NOT NULL,
  emails          jsonb NOT NULL,
  success         boolean NOT NULL,
  user_name       varchar(128) NOT NULL,
  user_oid        varchar(64) NOT NULL,

  FOREIGN KEY (avustushaku_id)  REFERENCES hakija.avustushaut (id)
);
