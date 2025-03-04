CREATE INDEX IF NOT EXISTS hakemukset_open ON hakija.hakemukset(version_closed) WHERE version_closed is null;
