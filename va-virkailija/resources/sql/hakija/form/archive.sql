INSERT INTO archived_forms (form_id, created_at, content, rules)
    SELECT id, created_at, content, rules FROM forms WHERE id = :form_id