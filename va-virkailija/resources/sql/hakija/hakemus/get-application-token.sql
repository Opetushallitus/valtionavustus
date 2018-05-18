SELECT
  token
FROM hakija.application_tokens
WHERE
  application_id = :application_id AND revoked IS NULL
LIMIT 1
