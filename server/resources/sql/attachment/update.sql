insert into attachments (id, version, hakemus_id, hakemus_version, field_id, filename, content_type, file_size, file_data)
select id,
       max(version) + 1,
       :hakemus_id,
       :hakemus_version,
       :field_id,
       :filename,
       :content_type,
       :file_size,
       :file_data
from attachments
where hakemus_id = :hakemus_id and field_id = :field_id
group by id
