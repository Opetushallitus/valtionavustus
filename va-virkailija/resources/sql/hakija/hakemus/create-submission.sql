INSERT INTO hakija.form_submissions
  (id, version, form, answers)
  SELECT
    nextval('hakija.form_submissions_id_seq'), version + 1, :form, :answers
  FROM
    hakija.hakemukset
  WHERE
    user_key = :user_key
  ORDER BY version DESC LIMIT 1
RETURNING *
