SELECT
  *
FROM
  form_submissions
WHERE
  id = :submission_id AND
  form = :form_id AND
  version = :version
LIMIT 1
