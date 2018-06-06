CREATE TABLE virkailija.batch_documents (
  id            SERIAL PRIMARY KEY,
  created_at    TIMESTAMP with time zone NOT NULL DEFAULT now(),
  batch_id      INTEGER NOT NULL,
  document_id   VARCHAR(12),
  phase         INTEGER DEFAULT 0,
  deleted       BOOLEAN
);

comment on table batch_documents is 'Documents of payments batches';
comment on column batch_documents.document_id is 'ASHA document id';
comment on column batch_documents.phase is 'Payment phase';

INSERT INTO virkailija.batch_documents(batch_id, document_id)
  SELECT DISTINCT b.id, b.document_id FROM virkailija.payment_batches b;

ALTER
  TABLE virkailija.payment_batches
  DROP COLUMN document_id;
