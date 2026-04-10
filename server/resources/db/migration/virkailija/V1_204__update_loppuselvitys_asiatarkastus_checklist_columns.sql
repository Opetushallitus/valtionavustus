ALTER TABLE virkailija.loppuselvitys_asiatarkastus_checklist
  DROP COLUMN IF EXISTS ehtojen_mukaisesti_ei_epaselvyyksia,
  DROP COLUMN IF EXISTS kirjanpidon_paakirja_liitetty;

ALTER TABLE virkailija.loppuselvitys_asiatarkastus_checklist
  ADD COLUMN IF NOT EXISTS taloustiedot_kirjattu BOOLEAN NOT NULL DEFAULT FALSE;
