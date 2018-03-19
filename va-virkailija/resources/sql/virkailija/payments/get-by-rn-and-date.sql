SELECT
  p.id, p.version, p.application_id,
  p.application_version, p.state, b.document_type, b.invoice_date, b.due_date,
  b.receipt_date, b.transaction_account, b.currency, b.partner,
  b.inspector_email, b.acceptor_email, b.batch_number, p.filename, p.user_name,
  p.user_oid, p.batch_id, p.payment_sum
FROM
  virkailija.payments AS p
JOIN
  virkailija.payment_batches AS b
    ON
      b.id = p.batch_id
JOIN
  hakija.hakemukset AS h
  ON
    (p.application_id = h.id AND h.version_closed IS NULL AND
     h.register_number = :register_number)
WHERE
  b.invoice_date = :invoice_date::date AND p.deleted IS NULL AND
  p.version_closed IS NULL ;
