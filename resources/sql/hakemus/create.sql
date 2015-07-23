INSERT INTO hakemukset (user_key, email_key, form_submission_id, form_submission_version)
SELECT :user_key,
       :email_key,
       submissions.id,
       submissions.version
FROM form_submissions submissions
WHERE
   id = :form_submission AND version_closed IS NULL
