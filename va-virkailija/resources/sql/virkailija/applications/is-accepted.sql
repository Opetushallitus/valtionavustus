SELECT
  status = 'accepted' AS accepted
FROM
  virkailija.arviot
WHERE
  hakemus_id = :hakemus_id
