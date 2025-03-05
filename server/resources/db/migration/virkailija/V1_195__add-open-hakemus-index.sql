CREATE INDEX IF NOT EXISTS hakemukset_open_form_submission_id ON hakija.hakemukset(form_submission_id) WHERE version_closed is null;

CREATE INDEX IF NOT EXISTS form_submission_open_id ON hakija.form_submissions(id) WHERE version_closed is null;
