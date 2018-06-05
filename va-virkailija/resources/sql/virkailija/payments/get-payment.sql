SELECT id, version, version_closed, created_at, application_id,
  application_version, state, batch_id, payment_sum, phase
FROM
  virkailija.payments
WHERE
  p.id = :id AND p.deleted IS NULL AND p.version_closed IS NULL
ORDER
  BY p.version DESC
LIMIT
  1
