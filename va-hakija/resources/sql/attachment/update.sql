INSERT INTO attachments (id, version, hakemus_id, hakemus_version, field_id, filename, content_type, file_size, file_data)
SELECT id,
       max(version) + 1,
       :hakemus_id,
       :hakemus_version,
       :field_id,
       :filename,
       :content_type,
       :file_size,
       :file_data
FROM attachments
WHERE hakemus_id = :hakemus_id AND field_id = :field_id
GROUP BY id
