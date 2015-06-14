UPDATE form_submissions SET (answers) = (:answers) WHERE form = :form_id AND id = :submission_id AND closed_at IS NULL
