SELECT
  id, version, version_closed, created_at, application_id, application_version,
  state, filename, user_name, batch_id, payment_sum
FROM
  virkailija.payments
WHERE
  application_id = :application_id AND
  version_closed IS NULL AND
  deleted IS NULL
ORDER
  BY id;
