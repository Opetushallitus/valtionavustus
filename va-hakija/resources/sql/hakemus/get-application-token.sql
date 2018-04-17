SELECT
  id, application_id, token
FROM
  hakija.application_tokens
WHERE
  application_id = :application_id
  AND token = :token
  AND revoked IS NOT TRUE
