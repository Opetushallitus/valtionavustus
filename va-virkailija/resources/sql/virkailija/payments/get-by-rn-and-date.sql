SELECT
  p.id, p.version, p.application_id,
  p.application_version, p.state, p.document_type, p.invoice_date, p.due_date,
  p.receipt_date, p.transaction_account, p.currency,
  p.partner, p.inspector_email, p.acceptor_email, p.installment_number,
  p.organisation, p.filename, p.user_name, p.user_oid
FROM
  virkailija.payments AS p
JOIN
  hakija.hakemukset AS h
  ON
    (p.application_id = h.id AND h.version_closed IS NULL AND
     h.register_number = :register_number)
WHERE
  p.invoice_date = :invoice_date::date AND p.deleted IS NULL AND
  p.version_closed IS NULL ;
