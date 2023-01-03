-- Migrated talousarviotilit do not have a name, so drop the constraint
ALTER TABLE talousarviotilit
  ALTER COLUMN name
    DROP NOT NULL;

ALTER TABLE talousarviotilit ADD CONSTRAINT not_null_name_if_normalized
  CHECK (migrated_from_not_normalized_ta_tili = true OR name is not null);

ALTER TABLE talousarviotilit
  DROP CONSTRAINT IF EXISTS unique_not_normalized_tatili_code_and_name;

--
CREATE UNIQUE INDEX unique_not_normalized_tatili_code
  ON talousarviotilit(code)
  WHERE migrated_from_not_normalized_ta_tili;
