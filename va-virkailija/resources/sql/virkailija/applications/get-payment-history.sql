SELECT
  id, version, version_closed, created_at, application_id, application_version,
  state, installment_number, organisation, document_type, invoice_date, due_date,
  receipt_date, transaction_account, currency, partner, inspector_email,
  acceptor_email, deleted
FROM
  virkailija.payments
WHERE
  application_id = :application_id
ORDER BY created_at;
