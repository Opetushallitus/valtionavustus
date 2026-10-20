ALTER TABLE virkailija.paatos
  ADD COLUMN paatos_template_version integer NOT NULL DEFAULT 1;
ALTER TABLE virkailija.paatos ALTER COLUMN paatos_template_version DROP DEFAULT;
