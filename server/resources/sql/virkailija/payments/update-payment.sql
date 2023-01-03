INSERT INTO
  virkailija.payments
    (id, version, application_id, application_version, paymentstatus_id, filename,
     user_name, user_oid, batch_id, payment_sum, phase, pitkaviite, project_code, outgoing_invoice)
VALUES(
  :id,
  (SELECT GREATEST(MAX(version), 0) + 1
    FROM virkailija.payments WHERE id = :id AND deleted IS NULL),
  :application_id, :application_version, :paymentstatus_id, :filename, :user_name,
  :user_oid, :batch_id, :payment_sum, :phase, :pitkaviite, :project_code, XMLPARSE (DOCUMENT :outgoing_invoice))
RETURNING
  id, version, version_closed, created_at, application_id, application_version,
  paymentstatus_id, batch_id, payment_sum, phase, pitkaviite, project_code, outgoing_invoice::text;
