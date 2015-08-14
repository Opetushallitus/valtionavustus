INSERT INTO hakemukset(id, user_key, version, form_submission_id, form_submission_version, status, last_status_change_at)
SELECT id,
       :user_key,
       max(version) + 1,
       :form_submission_id,
       :form_submission_version,
       :status,
       now()
FROM hakemukset
WHERE user_key = :user_key AND form_submission_id = :form_submission_id
GROUP BY id
