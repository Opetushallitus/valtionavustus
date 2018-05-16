SELECT
  COUNT(id) > 0 AS unpaid
FROM
  virkailija.payments
WHERE
  application_id = :application_id
  AND version_closed IS NULL
  AND deleted IS NULL
  AND (state < 2 OR state IS NULL)
LIMIT 1
