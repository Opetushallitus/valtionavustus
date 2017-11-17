ALTER TABLE payments
  ALTER COLUMN id
    TYPE INTEGER;

ALTER TABLE payments
  ALTER COLUMN id
    SET NOT NULL;

ALTER TABLE payments
  ADD version INTEGER;

UPDATE payments
  SET version = 0;

ALTER TABLE payments
  ALTER COLUMN version
    SET NOT NULL;

ALTER TABLE hakija.payments
  DROP CONSTRAINT payments_pkey;

ALTER TABLE hakija.payments
  ADD PRIMARY KEY (id, version);

