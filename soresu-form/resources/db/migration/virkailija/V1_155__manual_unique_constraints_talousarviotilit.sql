ALTER TABLE talousarviotilit
  DROP CONSTRAINT IF EXISTS talousarviotilit_code_year_key;

CREATE UNIQUE INDEX unique_normalized_tatili_code_and_year
  ON talousarviotilit(code, year)
  WHERE NOT migrated_from_not_normalized_ta_tili;

CREATE UNIQUE INDEX unique_not_normalized_tatili_code_and_name
  ON talousarviotilit(code, name)
  WHERE migrated_from_not_normalized_ta_tili;
