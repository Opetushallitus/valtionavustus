insert into archived_avustushaut (avustushaku_id, form_id, created_at, status, register_number, multiple_rahoitusalue, content, decision)
  SELECT id, form, created_at, status, register_number, multiple_rahoitusalue, content, decision FROM avustushaut WHERE id = :id;
