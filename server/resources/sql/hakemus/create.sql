INSERT INTO hakemukset (
    id,
    avustushaku,
    version,
    user_key,
    form_submission_id,
    form_submission_version,
    budget_total,
    budget_oph_share,
    organization_name,
    project_name,
    language,
    register_number,
    last_status_change_at,
    hakemus_type,
    parent_id
)
SELECT nextval('hakemukset_id_seq'),
       :avustushaku_id,
       0,
       :user_key,
       submissions.id,
       submissions.version,
       :budget_total,
       :budget_oph_share,
       :organization_name,
       :project_name,
       :language,
       :register_number,
       now(),
       :hakemus_type,
       :parent_id
FROM form_submissions submissions
WHERE id = :form_submission AND version_closed IS NULL
