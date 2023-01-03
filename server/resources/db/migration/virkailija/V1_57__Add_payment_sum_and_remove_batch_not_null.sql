ALTER TABLE
  virkailija.payments
ADD COLUMN
  payment_sum INTEGER DEFAULT 0,
ALTER COLUMN
  batch_id
DROP NOT NULL;
