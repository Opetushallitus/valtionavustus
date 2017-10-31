INSERT INTO payments (application_id, application_version, grant_id, state,
  installment, document_type, invoice_date, due_date, amount, long_ref,
  receipt_date, transaction_account, currency, lkp_account, takp_account)
VALUES (:application_id, :application_version, :grant_id, :state,
  :installment, :document_type, now(), now() + '7 days', :amount, :long_ref,
  now(), :transaction_account, :currency, :lkp_account, :takp_account)

