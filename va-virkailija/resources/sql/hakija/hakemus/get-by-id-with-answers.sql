select *, s.answers->'value' as answer_values
from hakija.hakemukset h
  join hakija.form_submissions s on (h.form_submission_id = s.id and h.form_submission_version = s.version)
where h.id = :id and h.version_closed is null;