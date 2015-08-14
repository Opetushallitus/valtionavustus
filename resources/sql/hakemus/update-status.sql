INSERT INTO hakemukset(id, user_key, version, form_submission_id, form_submission_version, status, last_status_change_at)
SELECT hakemukset.id,
       :user_key,
       max(hakemukset.version) + 1,
       hakemukset.form_submission_id,
       max(form_submissions.version),
       :status,
       now()
FROM hakemukset, form_submissions
WHERE hakemukset.user_key = :user_key AND hakemukset.form_submission_id = form_submissions.id AND form_submissions.version_closed IS NULL
GROUP BY hakemukset.id, hakemukset.form_submission_id
