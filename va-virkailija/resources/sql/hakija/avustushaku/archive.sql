insert into archived_avustushaut (
    avustushaku_id,
    form_id,
    created_at,
    status,
    haku_type,
    register_number,
    multiple_rahoitusalue,
    is_academysize,
    content,
    decision)
  select
    id,
    form,
    created_at,
    status,
    haku_type,
    register_number,
    multiple_rahoitusalue,
    is_academysize,
    content,
    decision
  from avustushaut
  where id = :id
