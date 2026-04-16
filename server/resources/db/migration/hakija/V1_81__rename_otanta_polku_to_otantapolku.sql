-- Drop CHECK constraints that reference the old column name
ALTER TABLE hakija.hakemukset
  DROP CONSTRAINT loppuselvitys_otanta_polku_check;

ALTER TABLE hakija.hakemukset
  DROP CONSTRAINT loppuselvitys_riskiperusteinen_requires_otannan_ulkopuolella;

-- Rename the column
ALTER TABLE hakija.hakemukset
  RENAME COLUMN loppuselvitys_otanta_polku TO loppuselvitys_otantapolku;

-- Re-add CHECK constraints with the new column name
ALTER TABLE hakija.hakemukset
  ADD CONSTRAINT loppuselvitys_otantapolku_check
  CHECK (loppuselvitys_otantapolku IS NULL
         OR loppuselvitys_otantapolku IN ('otannan-ulkopuolella', 'satunnaisotanta'));

ALTER TABLE hakija.hakemukset
  ADD CONSTRAINT loppuselvitys_riskiperusteinen_requires_otannan_ulkopuolella
  CHECK (NOT loppuselvitys_riskiperusteinen
         OR loppuselvitys_otantapolku = 'otannan-ulkopuolella');
