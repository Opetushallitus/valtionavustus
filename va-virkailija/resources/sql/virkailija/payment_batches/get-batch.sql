SELECT
  id, created_at, batch_number, document_type, invoice_date, due_date,
  receipt_date, transaction_account, currency, partner, inspector_email,
  acceptor_email, grant_id
FROM
  virkailija.payment_batches
WHERE
  id = :batch_id;
