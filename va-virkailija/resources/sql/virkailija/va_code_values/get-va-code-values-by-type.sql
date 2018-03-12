SELECT
  id, value_type, year, code, code_value
FROM
  virkailija.va_code_values
WHERE
  value_type = :value_type AND deleted IS NULL
