ALTER TABLE virkailija.palautettu_asiatarkastus
  -- returns made before syy was asked get the default
  ADD COLUMN syy TEXT NOT NULL DEFAULT 'Ei kirjattu',
  ADD COLUMN avustus_kaytetty_paatoksen_mukaisesti BOOLEAN,
  ADD COLUMN omarahoitus_kaytetty BOOLEAN,
  ADD COLUMN taloustiedot_kirjattu BOOLEAN,
  ADD COLUMN avustus_alle_100k BOOLEAN,
  ADD COLUMN riskiperusteinen BOOLEAN;

ALTER TABLE virkailija.palautettu_asiatarkastus ALTER COLUMN syy DROP DEFAULT;
