ALTER TABLE virkailija.talousarviotilit
ADD CONSTRAINT non_migrated_code_is_valid_check CHECK
  (migrated_from_not_normalized_ta_tili = true OR
   code ~ '^(\d{1,2}\.)(\d{1,2}\.)*(\d{1,2}\.?)$')
