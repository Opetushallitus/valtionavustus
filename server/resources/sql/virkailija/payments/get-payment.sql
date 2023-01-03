SELECT id, version, version_closed, created_at, application_id,
  application_version, paymentstatus_id, batch_id, payment_sum, phase, pitkaviite, project_code, outgoing_invoice::text
FROM
  virkailija.payments
WHERE
  id = :id AND deleted IS NULL AND version_closed IS NULL
ORDER
  BY version DESC
LIMIT
  1
