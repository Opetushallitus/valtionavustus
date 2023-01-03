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
    hankkeen_alkamispaiva,
    hankkeen_paattymispaiva,
    operation_id,
    muutoshakukelpoinen)
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
    hankkeen_alkamispaiva,
    hankkeen_paattymispaiva,
    operation_id,
    muutoshakukelpoinen
  from avustushaut
  where id = :id
