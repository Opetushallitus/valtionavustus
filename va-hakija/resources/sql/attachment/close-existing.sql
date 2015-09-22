update attachments set (version_closed) = (now())
where hakemus_id = :hakemus_id and
      field_id = :field_id and
      version_closed is null;
