INSERT INTO
  virkailija.payment_batches (batch_number, document_type, invoice_date,
  due_date, receipt_date, transaction_account, currency, partner,
  inspector_email, acceptor_email, grant_id, document_id)
VALUES
  ((SELECT GREATEST(MAX(batch_number), 0) + 1
   FROM virkailija.payment_batches
   WHERE date_part('year', created_at) = date_part('year', CURRENT_DATE)),
  :document_type, :invoice_date, :due_date, :receipt_date, :transaction_account,
  :currency, :partner, :inspector_email, :acceptor_email, :grant_id,
  :document_id)
RETURNING
  id, batch_number, document_type, invoice_date,
  due_date, receipt_date, transaction_account, currency, partner,
  inspector_email, acceptor_email, grant_id, document_id
