UPDATE hakemukset
  SET submitted_version = version
  WHERE
    user_key = :user_key AND
    form_submission_id = :form_submission_id AND
    version = :version AND
    version_closed IS NULL
