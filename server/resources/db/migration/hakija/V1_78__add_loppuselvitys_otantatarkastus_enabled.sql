ALTER TABLE hakija.avustushaut ADD COLUMN loppuselvitys_otantatarkastus_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE hakija.archived_avustushaut ADD COLUMN loppuselvitys_otantatarkastus_enabled BOOLEAN NOT NULL DEFAULT FALSE;
