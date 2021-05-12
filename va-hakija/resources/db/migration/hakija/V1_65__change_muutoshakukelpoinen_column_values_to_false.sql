ALTER TABLE hakija.avustushaut DROP COLUMN muutoshakukelpoinen;
ALTER TABLE hakija.avustushaut ADD COLUMN muutoshakukelpoinen bool NOT NULL DEFAULT false;
ALTER TABLE hakija.avustushaut ALTER COLUMN muutoshakukelpoinen DROP DEFAULT;

