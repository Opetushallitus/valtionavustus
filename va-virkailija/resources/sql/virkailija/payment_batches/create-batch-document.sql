INSERT
  INTO
    virkailija.batch_documents (batch_id, document_id, phase, presenter_email,
      acceptor_email)
  VALUES (:batch_id, :document_id, :phase, :presenter_email, :acceptor_email)
RETURNING
  id, created_at, document_id, phase, presenter_email, acceptor_email
