UPDATE hakemukset
SET
  avustushaku = :avustushaku_id,
  user_key = :user_key,
  form_submission_id = :form_submission_id,
  form_submission_version = :form_submission_version,
  user_oid = :user_oid,
  user_first_name = :user_first_name,
  user_last_name = :user_last_name,
  user_email = :user_email,
  budget_total = :budget_total,
  budget_oph_share = :budget_oph_share,
  organization_name = :organization_name,
  project_name = :project_name,
  language = :language,
  register_number = :register_number,
  business_id = :business_id,
  owner_type = :owner_type
WHERE
  user_key = :user_key AND
  form_submission_id = :form_submission_id AND
  version_closed IS NULL AND
  version = :version
