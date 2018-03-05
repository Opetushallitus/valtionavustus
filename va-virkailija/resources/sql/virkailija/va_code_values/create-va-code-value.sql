INSERT INTO
  virkailija.va_code_values (value_type, year, code, code_value)
VALUES
  (:value_type, :year, :code, :code_value)
RETURNING
  id, value_type, year, code, code_value
