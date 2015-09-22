select attachments.id, attachments.version, hakemus_id, hakemus_version, attachments.created_at,
       field_id, filename, file_size, content_type
from attachments
join hakemukset on hakemus_id = hakemukset.id AND
                   hakemus_version = hakemukset.version
where hakemukset.avustushaku = :avustushaku_id and
      attachments.version_closed is null
