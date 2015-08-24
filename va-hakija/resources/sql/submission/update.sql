INSERT INTO form_submissions (id, version, form, answers)
SELECT :submission_id,
       max(version) + 1,
       :form_id,
       :answers
FROM form_submissions
WHERE id = :submission_id AND form = :form_id
