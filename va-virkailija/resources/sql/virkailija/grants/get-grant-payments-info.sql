SELECT
  SUM(p.payment_sum) AS total_granted,
  COUNT(p.id) AS count
FROM
  virkailija.payments p
WHERE
  p.batch_id = :batch_id
  AND p.state = 2
  AND p.version_closed IS NULL
  AND p.deleted IS NULL
