DROP TABLE emails;

CREATE TABLE emails (
  id serial PRIMARY KEY,
  hakemus_id integer NOT NULL,
  formatted TEXT NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (hakemus_id) REFERENCES hakemus (id)
);

CREATE TRIGGER update_email_updated_at_timestamp
BEFORE UPDATE ON emails
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_timestamp();
