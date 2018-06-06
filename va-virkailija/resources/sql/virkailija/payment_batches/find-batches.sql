SELECT
  id, created_at, batch_number, invoice_date, due_date, receipt_date, currency,
  partner, inspector_email, acceptor_email, grant_id, document_id, phase
FROM
  virkailija.payment_batches
WHERE
  receipt_date = :batch_date::date AND grant_id = :grant_id
ORDER
  BY id DESC
