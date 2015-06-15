INSERT INTO hakemukset (user_key, form_submission_id, form_submission_version, status)
SELECT :user_key,
       submissions.id,
       submissions.version,
       :status
FROM form_submissions submissions
WHERE
   id = :form_submission AND version_closed IS NULL
