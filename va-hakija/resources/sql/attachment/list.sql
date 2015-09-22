select id, version, hakemus_id, hakemus_version, created_at, field_id, filename, file_size, content_type
from attachments
where hakemus_id = :hakemus_id and
      version_closed is null
