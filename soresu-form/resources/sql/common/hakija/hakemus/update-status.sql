UPDATE hakemukset
SET
  avustushaku = :avustushaku_id,
  user_key = :user_key,
  form_submission_id = :form_submission_id,
  form_submission_version = :form_submission_version,
  budget_total = :budget_total,
  budget_oph_share = :budget_oph_share,
  organization_name = :organization_name,
  project_name = :project_name,
  language = :language,
  register_number = :register_number,
  user_oid = :user_oid,
  user_first_name = :user_first_name,
  user_last_name = :user_last_name,
  user_email = :user_email,
  status = :status,
  status_change_comment = :status_change_comment,
  last_status_change_at = now()

WHERE
  user_key = :user_key AND
  form_submission_id = :form_submission_id AND
  version_closed IS NULL AND
  version = :version
