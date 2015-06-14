UPDATE form_submissions SET (closed_at) = now() WHERE form = :form_id AND id = :submission_id AND closed_at IS NULL;

INSERT INTO form_submissions (id, version, form, answers)
SELECT :submission_id,
       max(version) + 1,
       :form_id,
       :answers
FROM form_submissions
WHERE id = :submission_id AND form = :form_id
