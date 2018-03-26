SELECT
  SUM(payment_sum) AS total_paid
FROM
  virkailija.payments
WHERE
  application_id = :application_id;
