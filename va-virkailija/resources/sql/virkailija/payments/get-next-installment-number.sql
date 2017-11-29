SELECT
  GREATEST(MAX(installment_number), 0) + 1 AS installment_number
FROM
  virkailija.payments
WHERE
  date_part('year', created_at) = date_part('year', CURRENT_DATE);

