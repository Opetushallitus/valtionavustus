ALTER TABLE email_event
ADD COLUMN avustushaku_id integer;

ALTER TABLE email_event ADD FOREIGN KEY(avustushaku_id) REFERENCES hakija.avustushaut (id);
