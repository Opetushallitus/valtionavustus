UPDATE virkailija.batch_documents SET document_id = 'Puuttuu' WHERE document_id IS NULL;
ALTER TABLE virkailija.batch_documents ALTER document_id SET NOT NULL;
