SELECT
  id, created_at, batch_number, invoice_date, due_date, receipt_date, currency,
  partner, grant_id
FROM
  virkailija.payment_batches
WHERE
  id = :batch_id;
