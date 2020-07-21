UPDATE
  virkailija.va_code_values
SET
  hidden = :hidden
WHERE
  id = :id
RETURNING
  id
