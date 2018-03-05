UPDATE
  virkailija.va_code_values
SET
  deleted = TRUE
WHERE
  id = :id
RETURNING
  id
