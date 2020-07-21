SELECT
  id, value_type, year, code, code_value, hidden
FROM
  virkailija.va_code_values
WHERE
  value_type = :value_type AND year = :year AND deleted IS NULL
