ALTER TABLE virkailija.paatos_sisaltomuutos
ALTER COLUMN hyvaksytyt_sisaltomuutokset DROP NOT NULL;

ALTER TABLE virkailija.paatos_sisaltomuutos
ADD CONSTRAINT hyvaksytyt_sisaltomuutokset_nullable_only_if_rejected CHECK (
  status = 'rejected'
  AND hyvaksytyt_sisaltomuutokset IS NULL
  OR
  status <> 'rejected'
  AND hyvaksytyt_sisaltomuutokset IS NOT NULL
);
