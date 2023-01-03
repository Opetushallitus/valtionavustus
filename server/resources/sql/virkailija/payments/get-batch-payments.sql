SELECT id, version, version_closed, created_at, application_id,
  application_version, paymentstatus_id, batch_id, payment_sum, phase, pitkaviite, project_code
FROM
  virkailija.payments
WHERE
  batch_id = :batch_id AND deleted IS NULL AND version_closed IS NULL
