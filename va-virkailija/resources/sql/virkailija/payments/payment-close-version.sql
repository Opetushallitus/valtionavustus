UPDATE
  virkailija.payments
SET
  version_closed = now()
WHERE
  id = :id AND version = :version
RETURNING id;
