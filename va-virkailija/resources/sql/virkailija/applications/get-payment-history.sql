SELECT
  p.id, p.version, p.version_closed, p.created_at, p.application_id,
  p.application_version, p.state, b.batch_number, b.document_type,
  b.invoice_date, b.due_date, b.receipt_date, b.transaction_account, b.currency,
  b.partner, b.inspector_email, b.acceptor_email, p.deleted, p.user_name,
  p.batch_id, p.phase
FROM
  virkailija.payments p
JOIN
  virkailija.payment_batches b
    ON
      p.batch_id = b.id
WHERE
  application_id = :application_id
ORDER BY created_at;
