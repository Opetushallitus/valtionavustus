SELECT
  GREATEST(MAX(installment_number), 0) + 1 AS installment_number
FROM
  virkailija.payments;
