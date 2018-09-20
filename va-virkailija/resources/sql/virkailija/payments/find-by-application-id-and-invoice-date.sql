SELECT
  p.id, p.version, p.application_id, p.application_version, p.state, p.filename,
  p.user_name, p.user_oid, p.batch_id, p.payment_sum, p.phase
FROM
  virkailija.payments AS p
LEFT JOIN
  virkailija.payment_batches AS b
    ON
      b.id = p.batch_id
WHERE
  p.application_id = :application_id AND
  p.phase = :phase AND
  p.deleted IS NULL AND
  p.version_closed IS NULL;
