CREATE INDEX hakemukset_open ON hakija.hakemukset(version_closed) WHERE version_closed is null;
