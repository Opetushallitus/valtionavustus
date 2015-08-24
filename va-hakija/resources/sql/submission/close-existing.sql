UPDATE form_submissions SET (version_closed) = (now()) WHERE form = :form_id AND id = :submission_id AND version_closed IS NULL;
