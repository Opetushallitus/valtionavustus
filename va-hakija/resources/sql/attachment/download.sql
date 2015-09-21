SELECT file_size, content_type, filename, file_data FROM attachments
WHERE hakemus_id = :hakemus_id AND
      field_id = :field_id AND
      version_closed IS NULL
