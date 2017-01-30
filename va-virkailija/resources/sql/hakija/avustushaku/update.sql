update avustushaut
set content = :content,
    form = :form,
    status = :status,
    haku_type = :haku_type,
    register_number = :register_number,
    multiple_rahoitusalue = :multiple_rahoitusalue,
    is_academysize = :is_academysize,
    decision = :decision,
    loppuselvitysdate = :loppuselvitysdate,
    valiselvitysdate = :valiselvitysdate
where id = :id
