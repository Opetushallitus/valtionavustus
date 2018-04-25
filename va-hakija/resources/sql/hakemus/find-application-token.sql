SELECT
  id, application_id, token
FROM
  hakija.application_tokens
WHERE
  application_id = :application_id
  AND revoked IS NOT TRUE
