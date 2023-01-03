UPDATE
  virkailija.payments
SET
  deleted = now()
WHERE
  deleted IS NULL AND
  paymentstatus_id = 'waiting' AND
  id = :id
RETURNING
  id
