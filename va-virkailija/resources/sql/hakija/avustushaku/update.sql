update avustushaut
set content = :content,
    form = :form,
    status = :status,
    haku_type = :haku_type,
    register_number = :register_number,
    is_academysize = :is_academysize,
    decision = :decision,
    hankkeen_alkamispaiva = :hankkeen_alkamispaiva,
    hankkeen_paattymispaiva = :hankkeen_paattymispaiva,
    loppuselvitysdate = :loppuselvitysdate,
    valiselvitysdate = :valiselvitysdate,
    operation_id = :operation_id,
    operational_unit_id = :operational_unit_id,
    muutoshakukelpoinen = :muutoshakukelpoinen,
    allow_visibility_in_external_system = :allow_visibility_in_external_system,
    arvioitu_maksupaiva = :arvioitu_maksupaiva
where id = :id
