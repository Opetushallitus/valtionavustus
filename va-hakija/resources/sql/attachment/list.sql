SELECT id, version, hakemus_id, hakemus_version, created_at, field_id, filename, file_size, content_type
FROM attachments
WHERE hakemus_id = :hakemus_id AND
      version_closed IS NULL
