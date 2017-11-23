SELECT
  p.version, p.version_closed, p.created_at, p.application_id,
  p.application_version, p.state, p.installment_number, p.organisation,
  p.document_type, p.invoice_date, p.due_date, p.receipt_date,
  p.transaction_account, p.currency, p.partner, p.inspector_email,
  p.acceptor_email
FROM
  hakija.hakemukset AS h
JOIN
  virkailija.payments p
    ON (p.application_id = h.id AND p.version_closed IS NULL)
WHERE
  h.avustushaku = :id AND h.version_closed IS NULL;





