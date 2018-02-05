SELECT
  p.id, p.version, p.version_closed, p.created_at, p.application_id,
  p.application_version, p.state, b.batch_number AS installment_number,
  b.document_type, b.invoice_date, b.due_date, b.receipt_date,
  b.transaction_account, b.currency, b.partner, b.inspector_email,
  b.acceptor_email
FROM
  hakija.hakemukset AS h
JOIN
  virkailija.payments p
    ON
    (p.application_id = h.id AND p.version_closed IS NULL AND p.deleted IS NULL)
JOIN
  virkailija.payment_batches b
    ON
      b.id = p.batch_id
WHERE
  h.avustushaku = :id AND h.version_closed IS NULL;
