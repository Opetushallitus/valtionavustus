INSERT INTO virkailija.payments (id, version, application_id,
  application_version, state, document_type, invoice_date, due_date,
  receipt_date, transaction_account, currency, partner, inspector_email,
  acceptor_email, installment_number, organisation, user_name, user_oid)
VALUES(
  NEXTVAL('virkailija.payments_id_seq'), 0,
  :application_id, :application_version, :state, :document_type,
  :invoice_date::date, :due_date::date,
  :receipt_date::date, :transaction_account, :currency, :partner,
  :inspector_email, :acceptor_email, :installment_number, :organisation,
  :user_name, :user_oid)
RETURNING id, version, application_id,
  application_version, state, document_type, invoice_date, due_date,
  receipt_date, transaction_account, currency, partner, inspector_email,
  acceptor_email, installment_number, organisation;
