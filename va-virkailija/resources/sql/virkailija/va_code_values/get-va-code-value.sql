SELECT
  id, value_type, year, code, code_value
FROM
  virkailija.va_code_values
WHERE
  deleted IS NULL AND id = :id
