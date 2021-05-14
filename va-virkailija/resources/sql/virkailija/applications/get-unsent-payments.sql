SELECT
  *
FROM
  virkailija.payments
WHERE
  application_id = :application_id AND
  paymentstatus_id IN ('created', 'waiting') AND
  version_closed IS NULL AND
  deleted IS NULL
ORDER BY
  id DESC,
  version DESC
