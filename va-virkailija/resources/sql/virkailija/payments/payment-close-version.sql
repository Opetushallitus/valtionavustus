UPDATE
  virkailija.payments
SET
  version_closed = now()
WHERE
  id = :id AND version = :version AND DELETED IS NULL
RETURNING id;
