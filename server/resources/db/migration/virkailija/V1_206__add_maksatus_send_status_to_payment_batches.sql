-- Sending payments state needs to be stored in db.
-- UI polls the status of the job. send_status IS NULL means a batch that was not sent as
-- a background job: batches created before this migration.

ALTER TABLE virkailija.payment_batches
  ADD COLUMN send_status      text,
  ADD COLUMN sent_count       integer NOT NULL DEFAULT 0,
  ADD COLUMN total_count      integer;

ALTER TABLE virkailija.payment_batches
  ADD CONSTRAINT payment_batches_send_status_check
  CHECK (send_status IS NULL
         OR send_status IN ('sending', 'completed', 'failed'));

COMMENT ON COLUMN virkailija.payment_batches.send_status IS
  'Payment batch send status. NULL = not sent via background job.';
