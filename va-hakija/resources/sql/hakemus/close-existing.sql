UPDATE hakemukset SET (version_closed) = (now()) WHERE hakemukset.user_key = :user_key AND form_submission_id = :form_submission_id AND version_closed IS NULL;
