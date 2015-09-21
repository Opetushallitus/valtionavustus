UPDATE attachments SET (version_closed) = (now())
WHERE hakemus_id = :hakemus_id AND
      field_id = :field_id AND
      version_closed IS NULL;
