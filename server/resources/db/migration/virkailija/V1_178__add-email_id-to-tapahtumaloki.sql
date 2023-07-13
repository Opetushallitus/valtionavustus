ALTER TABLE virkailija.tapahtumaloki
ADD COLUMN email_id INTEGER NULL REFERENCES email(id);
