SELECT id, version, version_closed, created_at, application_id,
  application_version, state, installment_number, organisation, document_type,
  invoice_date, due_date, receipt_date, transaction_account, currency, partner,
  inspector_email, acceptor_email
FROM
  virkailija.payments
WHERE
  id = :id AND deleted IS NULL;

