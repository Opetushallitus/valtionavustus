INSERT INTO hakemukset(id, avustushaku, user_key, version, form_submission_id, form_submission_version,
                       budget_total, budget_oph_share, organization_name, project_name, language, register_number,
                       user_oid, user_first_name, user_last_name, user_email,
                       status, status_change_comment, last_status_change_at,hakemus_type,parent_id)
SELECT id,
       :avustushaku_id,
       :user_key,
       max(version) + 1,
       :form_submission_id,
       :form_submission_version,
       :budget_total,
       :budget_oph_share,
       :organization_name,
       :project_name,
       :language,
       :register_number,
       :user_oid,
       :user_first_name,
       :user_last_name,
       :user_email,
       :status,
       :status_change_comment,
       now(),
       hakemus_type,
       parent_id
FROM hakemukset
WHERE user_key = :user_key AND form_submission_id = :form_submission_id
GROUP BY id,hakemus_type,parent_id
