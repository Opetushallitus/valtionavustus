CREATE TABLE payment_batches (
   id                  SERIAL PRIMARY KEY,
   created_at          TIMESTAMP with time zone NOT NULL DEFAULT now(),
   batch_number        INTEGER NOT NULL,
   document_type       VARCHAR(2) NOT NULL,
   invoice_date        DATE,
   due_date            DATE,
   receipt_date        DATE,
   transaction_account VARCHAR(4) NOT NULL,
   currency            VARCHAR(3) NOT NULL DEFAULT 'EUR',
   partner             VARCHAR(6) NOT NULL,
   inspector_email     TEXT NOT NULL,
   acceptor_email      TEXT NOT NULL,
   grant_id            INTEGER NOT NULL
);

comment on table payment_batches is 'Maksuerä';
comment on column payment_batches.batch_number is
  'Order number of the payment in same year. Used for generating batch id string';
comment on column payment_batches.document_type is 'Tositelaji';
comment on column payment_batches.transaction_account is 'Maksuliikemenotili';
comment on column payment_batches.partner is 'Kumppanikoodi';

INSERT INTO payment_batches(batch_number, document_type, invoice_date, due_date,
  receipt_date, transaction_account, currency, partner, inspector_email,
  acceptor_email, grant_id)
  SELECT DISTINCT p.installment_number, p.document_type, p.invoice_date,
    p.due_date, p.receipt_date, p.transaction_account, p.currency, p.partner,
    p.inspector_email, p.acceptor_email, a.id
  FROM virkailija.payments AS p
  JOIN hakija.hakemukset AS h ON (h.id = p.application_id)
  JOIN hakija.avustushaut AS a ON (a.id = h.avustushaku);

ALTER TABLE
  virkailija.payments
ADD
  batch_id INTEGER REFERENCES virkailija.payment_batches(id);

UPDATE
  virkailija.payments AS p
SET
  batch_id = (
    SELECT
      id
    FROM
      virkailija.payment_batches AS b
    WHERE
      b.batch_number = p.installment_number AND
      b.document_type = p.document_type AND
      b.invoice_date = p.invoice_date AND
      b.due_date = p.due_date AND
      b.receipt_date = p.receipt_date AND
      b.transaction_account = p.transaction_account AND
      b.currency = p.currency AND
      b.partner = p.partner AND
      b.inspector_email = p.inspector_email AND
      b.acceptor_email = p.acceptor_email);

ALTER TABLE
  virkailija.payments
ALTER COLUMN
  batch_id
SET
  NOT NULL,
DROP COLUMN installment_number,
DROP COLUMN document_type,
DROP COLUMN invoice_date,
DROP COLUMN due_date,
DROP COLUMN receipt_date,
DROP COLUMN transaction_account,
DROP COLUMN currency,
DROP COLUMN partner,
DROP COLUMN inspector_email,
DROP COLUMN acceptor_email,
DROP COLUMN organisation;
