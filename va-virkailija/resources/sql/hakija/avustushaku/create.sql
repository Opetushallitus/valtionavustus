insert into avustushaut (
    form,
    content,
    register_number,
    decision,
    haku_type,
    project_id,
    operation_id,
    operational_unit_id,
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
    :created_at::timestamptz
)
