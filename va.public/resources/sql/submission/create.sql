INSERT INTO form_submissions (id, version, form, answers)
VALUES (nextval('form_submissions_id_seq'), 0, :form_id, :answers)
