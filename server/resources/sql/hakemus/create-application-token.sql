INSERT
  INTO hakija.application_tokens
    (application_id, token)
  VALUES
    (:application_id, :token)
RETURNING
  token
