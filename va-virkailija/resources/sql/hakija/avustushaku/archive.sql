insert into archived_avustushaut (
    avustushaku_id,
    form_id,
    created_at,
    status,
    haku_type,
    register_number,
    is_academysize,
    content,
    decision,
    operational_unit_id,
    project_id,
    operation_id)
  select
    id,
    form,
    created_at,
    status,
    haku_type,
    register_number,
    is_academysize,
    content,
    decision,
    operational_unit_id,
    project_id,
    operation_id
  from avustushaut
  where id = :id
returning decision::jsonb
