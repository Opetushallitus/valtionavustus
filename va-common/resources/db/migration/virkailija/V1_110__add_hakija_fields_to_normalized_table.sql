ALTER TABLE normalized_hakemus 
ADD COLUMN hakija_name TEXT;

ALTER TABLE normalized_hakemus 
ADD COLUMN hakija_email validated_email;
