SELECT id, version, version_closed, created_at, application_id,
  application_version, paymentstatus_id, batch_id, payment_sum, phase, pitkaviite, project_code, outgoing_invoice::text
FROM
  virkailija.payments p
WHERE
  p.id = :id AND p.version = :version AND p.deleted IS NULL
