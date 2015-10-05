insert into archived_avustushaut (avustushaku_id, form_id, created_at, status, content)
  SELECT id, form, created_at, status, content FROM avustushaut WHERE id = :id;
