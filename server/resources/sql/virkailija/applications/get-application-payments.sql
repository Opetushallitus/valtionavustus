SELECT
  payments.id,
  payments.version,
  payments.version_closed,
  payments.created_at,
  payments.application_id,
  payments.application_version,
  payments.paymentstatus_id,
  payments.filename,
  payments.user_name,
  payments.batch_id,
  payments.payment_sum,
  payments.phase,
  payments.project_code,
  coalesce(
    payments.pitkaviite,
    hakemukset.register_number
  ) as pitkaviite
FROM
  virkailija.payments
JOIN
  hakija.hakemukset ON (
    hakemukset.id = payments.application_id
    AND hakemukset.version = payments.application_version
  )
WHERE
  application_id = :application_id AND
  payments.version_closed IS NULL AND
  deleted IS NULL
ORDER
  BY id;
