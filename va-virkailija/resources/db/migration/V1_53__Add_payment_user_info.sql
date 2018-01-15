ALTER TABLE
  virkailija.payments
ADD
  user_name VARCHAR(128),
ADD
  user_oid VARCHAR(64);

UPDATE
  virkailija.payments
SET
  user_name = '', user_oid = '';

ALTER TABLE
  virkailija.payments
ALTER COLUMN
  user_name
SET
  NOT NULL,
ALTER COLUMN
  user_oid
SET
  NOT NULL;
