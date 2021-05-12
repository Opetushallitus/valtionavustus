UPDATE
  virkailija.payments
SET
  deleted = now()
WHERE
  deleted IS NULL AND
  application_id
    IN
      (SELECT DISTINCT
        id
       FROM
         hakija.hakemukset
       WHERE
         avustushaku = :id)
RETURNING
  id;
