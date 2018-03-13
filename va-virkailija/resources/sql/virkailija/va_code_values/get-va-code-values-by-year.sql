SELECT
  id, value_type, year, code, code_value
FROM
  virkailija.va_code_values
WHERE
  year = :year AND deleted IS NULL
