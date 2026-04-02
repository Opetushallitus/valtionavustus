ALTER TABLE hakija.hakemukset ADD COLUMN loppuselvitys_otanta_polku TEXT DEFAULT NULL;

ALTER TABLE hakija.hakemukset
  ADD CONSTRAINT loppuselvitys_otanta_polku_check
  CHECK (loppuselvitys_otanta_polku IN ('otannan-ulkopuolella', 'riskiperusteinen', 'satunnaisotanta'));
