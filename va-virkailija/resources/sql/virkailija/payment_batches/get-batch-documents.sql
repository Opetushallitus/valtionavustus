SELECT
  id, created_at, document_id, phase, presenter_email, acceptor_email
FROM
  virkailija.batch_documents
WHERE
  batch_id = :batch_id AND deleted IS NOT TRUE;
