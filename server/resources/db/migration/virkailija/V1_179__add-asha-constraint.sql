ALTER TABLE virkailija.batch_documents
ADD CONSTRAINT correct_asha_tunniste CHECK (document_id ~* '^ID\d{1,10}$') NOT VALID;
