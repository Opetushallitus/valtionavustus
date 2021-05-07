ALTER TABLE hakija.avustushaut ADD COLUMN muutoshakukelpoinen bool NOT NULL DEFAULT true;
ALTER TABLE hakija.avustushaut ALTER COLUMN muutoshakukelpoinen DROP DEFAULT;

ALTER TABLE hakija.archived_avustushaut ADD COLUMN muutoshakukelpoinen bool NOT NULL DEFAULT false;
ALTER TABLE hakija.archived_avustushaut ALTER COLUMN muutoshakukelpoinen DROP DEFAULT;
