SELECT p.id, p.version, p.version_closed, p.created_at, p.application_id,
  p.application_version, p.state, b.batch_number, b.document_type,
  b.invoice_date, b.due_date, b.receipt_date, b.transaction_account, b.currency,
  b.partner, b.inspector_email, b.acceptor_email
FROM
  virkailija.payments p
JOIN
  virkailija.payment_batches b
    ON
      b.id = p.batch_id
WHERE
  id = :id AND deleted IS NULL;
