SELECT
  p.id, p.version, p.application_id, p.application_version, p.paymentstatus_id, p.filename,
  p.user_name, p.user_oid, p.batch_id, p.payment_sum, p.phase, p.pitkaviite, project_code
FROM
  virkailija.payments AS p
WHERE
  p.application_id = :application_id AND
  p.phase = :phase AND
  p.deleted IS NULL AND
  p.version_closed IS NULL;
