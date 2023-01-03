ALTER TABLE email_event
  ADD COLUMN muutoshakemus_id integer,
  ADD CONSTRAINT fk_muutoshakemus FOREIGN KEY (muutoshakemus_id) REFERENCES muutoshakemus (id);
