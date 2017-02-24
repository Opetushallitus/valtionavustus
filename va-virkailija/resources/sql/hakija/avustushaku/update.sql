update avustushaut
set content = :content,
    form = :form,
    status = :status,
    haku_type = :haku_type,
    register_number = :register_number,
    is_academysize = :is_academysize,
    decision = :decision,
    loppuselvitysdate = :loppuselvitysdate,
    valiselvitysdate = :valiselvitysdate
where id = :id
