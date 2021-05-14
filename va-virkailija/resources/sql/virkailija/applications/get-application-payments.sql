SELECT
  id, version, version_closed, created_at, application_id, application_version,
  paymentstatus_id, filename, user_name, batch_id, payment_sum, phase
FROM
  virkailija.payments
WHERE
  application_id = :application_id AND
  version_closed IS NULL AND
  deleted IS NULL
ORDER
  BY id;
