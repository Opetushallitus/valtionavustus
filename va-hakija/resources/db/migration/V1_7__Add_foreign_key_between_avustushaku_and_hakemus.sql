ALTER TABLE hakemukset ADD COLUMN avustushaku INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE hakemukset ADD FOREIGN KEY(avustushaku) REFERENCES avustushaut(id);
ALTER TABLE hakemukset ALTER COLUMN avustushaku DROP DEFAULT;
CREATE INDEX ON hakemukset(avustushaku);
