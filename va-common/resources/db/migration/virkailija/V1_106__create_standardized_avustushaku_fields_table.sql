CREATE TABLE standardized_avustushaku (
  id                    serial PRIMARY KEY,
  avustushaku_id        integer UNIQUE NOT NULL,
  help_text_fi          TEXT NOT NULL,
  help_text_sv          TEXT NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (avustushaku_id) REFERENCES hakija.avustushaut (id)
);

CREATE TRIGGER update_standardized_avustushaku_updated_at_timestamp
BEFORE UPDATE ON standardized_avustushaku
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_timestamp();
