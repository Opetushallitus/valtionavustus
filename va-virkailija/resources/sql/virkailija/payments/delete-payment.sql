UPDATE
  virkailija.payments
SET
  deleted = now()
WHERE
  deleted IS NULL AND
  state = 1 AND
  id = :id
RETURNING
  id
