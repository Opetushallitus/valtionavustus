SELECT
  h.id
FROM
  hakija.hakemukset h
WHERE
  h.hakemus_type = 'hakemus'
  AND h.version_closed IS NULL
  AND h.user_key = :token
LIMIT 1;
