SELECT
  *
FROM
  virkailija.payments
WHERE
  application_id = :application_id AND
  version_closed IS NULL AND
  deleted IS NULL
ORDER BY
  id ASC,
  version DESC
LIMIT
  1;
