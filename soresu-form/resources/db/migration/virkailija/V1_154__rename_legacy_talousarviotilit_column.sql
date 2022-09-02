ALTER TABLE talousarviotilit
  DROP CONSTRAINT IF EXISTS not_null_year_and_amount_if_not_legacy;

ALTER TABLE talousarviotilit
  RENAME COLUMN is_legacy TO migrated_from_not_normalized_ta_tili;

ALTER TABLE talousarviotilit ADD CONSTRAINT not_null_year_and_amount_if_not_migrated_from_not_normalized_ta_tili
  CHECK (migrated_from_not_normalized_ta_tili = true OR (amount is not null AND year is not null ));
