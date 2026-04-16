-- Add new boolean column for the checklist-failure signal
ALTER TABLE hakija.hakemukset
  ADD COLUMN loppuselvitys_riskiperusteinen BOOLEAN NOT NULL DEFAULT FALSE;

-- Migrate existing 'riskiperusteinen' rows to the new model
-- (old 'riskiperusteinen' meant: checklist failed, with otanta_polku used as a single column)
UPDATE hakija.hakemukset
  SET loppuselvitys_riskiperusteinen = TRUE,
      loppuselvitys_otanta_polku = 'otannan-ulkopuolella'
  WHERE loppuselvitys_otanta_polku = 'riskiperusteinen';

-- Replace CHECK constraint to drop 'riskiperusteinen' from valid otanta_polku values
ALTER TABLE hakija.hakemukset
  DROP CONSTRAINT loppuselvitys_otanta_polku_check;

ALTER TABLE hakija.hakemukset
  ADD CONSTRAINT loppuselvitys_otanta_polku_check
  CHECK (loppuselvitys_otanta_polku IS NULL
         OR loppuselvitys_otanta_polku IN ('otannan-ulkopuolella', 'satunnaisotanta'));

-- Cross-column invariant: riskiperusteinen=TRUE only allowed when path is otannan-ulkopuolella
ALTER TABLE hakija.hakemukset
  ADD CONSTRAINT loppuselvitys_riskiperusteinen_requires_otannan_ulkopuolella
  CHECK (NOT loppuselvitys_riskiperusteinen
         OR loppuselvitys_otanta_polku = 'otannan-ulkopuolella');
