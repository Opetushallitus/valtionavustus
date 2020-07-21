SELECT
  DISTINCT ON (code)
  id, value_type, year, code, code_value, hidden
FROM
  virkailija.va_code_values
WHERE
  value_type = :value_type AND deleted IS NULL
ORDER
  BY code, year DESC
