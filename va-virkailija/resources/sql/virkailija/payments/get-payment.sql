SELECT id, version, version_closed, created_at, application_id,
  application_version, state, batch_id, payment_sum, phase
FROM
  virkailija.payments
WHERE
  id = :id AND deleted IS NULL AND version_closed IS NULL
ORDER
  BY version DESC
LIMIT
  1
