select file_size, content_type, filename, file_data from attachments
where hakemus_id = :hakemus_id and
      field_id = :field_id and
      version_closed is null
