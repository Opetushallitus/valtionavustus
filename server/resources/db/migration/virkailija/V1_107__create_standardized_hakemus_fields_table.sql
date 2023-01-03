CREATE TABLE standardized_hakemus (
  id                    serial PRIMARY KEY,
  hakemus_id            integer NOT NULL,
  help_text_fi          TEXT NOT NULL,
  help_text_sv          TEXT NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (hakemus_id) REFERENCES virkailija.hakemus (id)
);

CREATE TRIGGER update_standardized_hakemus_updated_at_timestamp
BEFORE UPDATE ON standardized_hakemus
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_timestamp();
