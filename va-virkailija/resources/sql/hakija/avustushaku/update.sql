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
    project_id = :project_id,
    operation_id = :operation_id,
    operational_unit_id = :operational_unit_id,
    muutoshakukelpoinen = :muutoshakukelpoinen
where id = :id
