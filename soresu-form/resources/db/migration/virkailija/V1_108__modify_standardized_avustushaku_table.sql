DROP TRIGGER update_standardized_avustushaku_updated_at_timestamp ON standardized_avustushaku;

DROP TABLE standardized_avustushaku;

CREATE TABLE standardized_avustushaku_help_text (
  id                    serial PRIMARY KEY,
  avustushaku_id        integer UNIQUE NOT NULL,

  ohjeteksti_fi    TEXT NOT NULL,
  ohjeteksti_sv    TEXT NOT NULL,

  hakija_name_fi   TEXT NOT NULL,
  hakija_name_sv   TEXT NOT NULL,

  hakija_email_fi  TEXT NOT NULL,
  hakija_email_sv  TEXT NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (avustushaku_id) REFERENCES hakija.avustushaut (id)
);

CREATE TRIGGER update_standardized_avustushaku_updated_at_timestamp
BEFORE UPDATE ON standardized_avustushaku_help_text
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_timestamp();
