INSERT INTO
  virkailija.payment_batches (document_type, invoice_date, due_date,
  receipt_date, transaction_account, currency, partner, inspector_email,
  acceptor_email, batch_number, grant_id)
VALUES
  :document_type,
  :invoice_date::date, :due_date::date,
  :receipt_date::date, :transaction_account, :currency, :partner,
  :inspector_email, :acceptor_email, :installment_number
RETURNING
  id, document_type, invoice_date, due_date,
  receipt_date, transaction_account, currency, partner, inspector_email,
  acceptor_email, batch_number, grant_id;
