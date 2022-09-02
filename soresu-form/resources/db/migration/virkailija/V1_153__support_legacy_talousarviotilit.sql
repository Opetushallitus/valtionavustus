-- Support migrations from legacy TA-tili format, which don't contain "year" or "amount"
ALTER TABLE talousarviotilit
  ADD COLUMN is_legacy BOOLEAN
  DEFAULT FALSE;

UPDATE talousarviotilit
  SET is_legacy = false;

ALTER TABLE talousarviotilit
  ALTER COLUMN amount
  DROP NOT NULL;

ALTER TABLE talousarviotilit
  ALTER COLUMN year
  DROP NOT NULL;

ALTER TABLE talousarviotilit ADD CONSTRAINT not_null_year_and_amount_if_not_legacy
  CHECK (is_legacy = true OR (amount is not null AND year is not null ));
