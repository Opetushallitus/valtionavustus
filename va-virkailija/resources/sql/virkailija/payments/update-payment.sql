INSERT INTO virkailija.payments (id, version, application_id,
  application_version, state, document_type, invoice_date, due_date,
  receipt_date, transaction_account, currency,
  partner, inspector_email, acceptor_email, installment_number, organisation)
VALUES(
  :id,
  (SELECT GREATEST(MAX(version), 0) + 1
    FROM virkailija.payments WHERE id = :id),
  :application_id, :application_version, :state, :document_type,
  :invoice_date::timestamptz, :due_date::timestamptz,
  :receipt_date::timestamptz, :transaction_account, :currency,
  :partner, :inspector_email, :acceptor_email, :installment_number,
  :organisation)
RETURNING *;
