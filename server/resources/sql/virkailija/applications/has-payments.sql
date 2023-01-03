SELECT
  COUNT(id) > 0 AS has_payments
FROM
  virkailija.payments
WHERE
  application_id = :application_id AND
  deleted IS NULL AND
  version_closed IS NULL
LIMIT 1
