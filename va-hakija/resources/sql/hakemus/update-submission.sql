INSERT INTO hakemukset(id, avustushaku, user_key, version, form_submission_id, form_submission_version,
                       user_oid, user_first_name, user_last_name, user_email,
                       budget_total, budget_oph_share, organization_name, project_name, language, status,
                       register_number, last_status_change_at, status_change_comment, hakemus_type,parent_id,status_valiselvitys,status_loppuselvitys)
SELECT id,
       :avustushaku_id,
       :user_key,
       version + 1,
       :form_submission_id,
       :form_submission_version,
       :user_oid,
       :user_first_name,
       :user_last_name,
       :user_email,
       :budget_total,
       :budget_oph_share,
       :organization_name,
       :project_name,
       :language,
       status,
       :register_number,
       last_status_change_at,
       status_change_comment,
       hakemus_type,
       parent_id,
       status_valiselvitys,
       status_loppuselvitys
FROM hakemukset
WHERE user_key = :user_key AND form_submission_id = :form_submission_id
GROUP BY id, status, last_status_change_at, version
ORDER BY version DESC
LIMIT 1
