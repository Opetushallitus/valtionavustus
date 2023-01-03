INSERT INTO hakija.hakemukset
  (id, avustushaku, status, version, user_key, form_submission_id,
   form_submission_version, budget_total, budget_oph_share, organization_name,
   project_name, language, register_number, last_status_change_at,hakemus_type, project_id)
SELECT nextval('hakija.hakemukset_id_seq'),
       :avustushaku_id,
       :status,
       :version,
       :user_key,
       :form_submission_id,
       :form_submission_version,
       :budget_total,
       :budget_oph_share,
       :organization_name,
       :project_name,
       :language,
       :register_number,
       now(),
       :hakemus_type,
       :project_id
RETURNING *
