SELECT
  *
FROM
  virkailija.arviot a
WHERE
  a.hakemus_id = :application_id
