UPDATE
  hakija.application_tokens
SET
  revoked = TRUE
WHERE
  token = :token
