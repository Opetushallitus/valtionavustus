ALTER TABLE
  virkailija.payments
ADD COLUMN
  payment_sum INTEGER DEFAULT 0,
ADD COLUMN
  decision_id INTEGER;
