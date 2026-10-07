-- Widen tyyppi to fit 'loppuselvitys-palautettu-asiatarkastukseen'
ALTER TABLE virkailija.tapahtumaloki ALTER COLUMN tyyppi TYPE VARCHAR(64);

CREATE TABLE virkailija.palautettu_asiatarkastus (
  tapahtumaloki_id INTEGER PRIMARY KEY REFERENCES virkailija.tapahtumaloki(id),
  information_verified_by TEXT,
  information_verified_at TIMESTAMP WITH TIME ZONE,
  information_verification TEXT
);
