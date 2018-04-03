SELECT
  *
FROM
  virkailija.payments
WHERE
  application_id = :application_id AND
  state = :state AND
  version_closed IS NULL AND
  deleted IS NULL
ORDER BY
  id DESC,
  version DESC
LIMIT
  1;
