ALTER TABLE hakija.hakemus_paatokset
  ADD COLUMN paatos_template_version integer NOT NULL DEFAULT 1;
ALTER TABLE hakija.hakemus_paatokset ALTER COLUMN paatos_template_version DROP DEFAULT;
