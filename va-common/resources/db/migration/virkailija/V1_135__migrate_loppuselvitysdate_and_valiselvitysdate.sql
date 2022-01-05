ALTER TABLE avustushaut DROP COLUMN valiselvitysdate;
ALTER TABLE avustushaut DROP COLUMN loppuselvitysdate;

ALTER TABLE avustushaut ADD valiselvitysdate DATE;
ALTER TABLE avustushaut ADD loppuselvitysdate DATE;

ALTER TABLE avustushaut DROP CONSTRAINT nn_alkamispaiva;
ALTER TABLE avustushaut DROP CONSTRAINT nn_paattymispaiva;

UPDATE avustushaut 
SET valiselvitysdate = to_date(selvitysdate_migration.valiselvitysdate, 'DD.MM.YYYY')
FROM selvitysdate_migration
WHERE avustushaut.id = selvitysdate_migration.avustushaku_id
  AND selvitysdate_migration.valiselvitysdate IS NOT NULL
  AND selvitysdate_migration.valiselvitysdate SIMILAR TO '[0-9][0-9]\.[0-9][0-9]\.[0-9][0-9][0-9][0-9]';

UPDATE avustushaut 
SET loppuselvitysdate = to_date(selvitysdate_migration.loppuselvitysdate, 'DD.MM.YYYY')
FROM selvitysdate_migration
WHERE avustushaut.id = selvitysdate_migration.avustushaku_id
  AND selvitysdate_migration.loppuselvitysdate IS NOT NULL
  AND selvitysdate_migration.loppuselvitysdate SIMILAR TO '[0-9][0-9]\.[0-9][0-9]\.[0-9][0-9][0-9][0-9]';

ALTER TABLE avustushaut ADD CONSTRAINT nn_alkamispaiva
    check (hankkeen_alkamispaiva IS NOT NULL OR (status != 'published' AND status != 'resolved')) NOT VALID;

ALTER TABLE avustushaut ADD CONSTRAINT nn_paattymispaiva
    check (hankkeen_paattymispaiva IS NOT NULL OR (status != 'published' AND status != 'resolved')) NOT VALID;
