INSERT INTO virkailija.va_code_values
  (id, value_type, year, code, code_value)
  SELECT nextval('virkailija.va_code_values_id_seq'),
 'project',
 2022,
  md5(random()::text),
  md5(random()::text)

RETURNING *
