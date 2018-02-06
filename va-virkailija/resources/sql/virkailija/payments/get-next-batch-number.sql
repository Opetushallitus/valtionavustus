SELECT
  GREATEST(MAX(batch_number), 0) + 1 AS batch_number
FROM
  virkailija.payment_batches
WHERE
  date_part('year', created_at) = date_part('year', CURRENT_DATE);
