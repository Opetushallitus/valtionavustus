INSERT INTO virkailija.payments (id, version, application_id,
  application_version, state, filename, user_name, user_oid, batch_id,
  payment_sum, phase)
VALUES(
  :id,
  (SELECT GREATEST(MAX(version), 0) + 1
    FROM virkailija.payments WHERE id = :id AND deleted IS NULL),
  :application_id, :application_version, :state, :filename, :user_name,
  :user_oid, :batch_id, :payment_sum, :phase)
RETURNING
  id, version, version_closed, created_at, application_id, application_version,
  state, batch_id, payment_sum, phase;
