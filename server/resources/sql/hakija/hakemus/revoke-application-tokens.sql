UPDATE
  hakija.application_tokens
SET
  revoked = TRUE
WHERE
  application_id = :application_id
  AND revoked IS NOT TRUE
RETURNING *
