insert into avustushaut (
    form,
    content,
    register_number,
    decision,
    haku_type,
    project_id,
    operation_id,
    operational_unit_id,
    muutoshakukelpoinen,
    form_loppuselvitys,
    form_valiselvitys,
    created_at
) values (
    :form,
    :content,
    :register_number,
    :decision,
    :haku_type,
    :project_id,
    :operation_id,
    :operational_unit_id,
    :muutoshakukelpoinen,
    :form_loppuselvitys,
    :form_valiselvitys,
    :created_at::timestamptz
)
