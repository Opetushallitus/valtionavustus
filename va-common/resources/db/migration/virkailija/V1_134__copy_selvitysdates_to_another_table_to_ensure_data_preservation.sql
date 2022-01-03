CREATE TABLE selvitysdate_migration (
  id                    serial primary key, 
  avustushaku_id        integer REFERENCES avustushaut(id) NOT NULL,
  valiselvitysdate      varchar(10),
  loppuselvitysdate     varchar(10)
);

INSERT INTO selvitysdate_migration (avustushaku_id, valiselvitysdate, loppuselvitysdate)
SELECT id, valiselvitysdate, loppuselvitysdate
FROM avustushaut;
