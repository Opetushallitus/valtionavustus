select h.status, s.answers->'value'
from hakija.hakemukset h
  join hakija.form_submissions s on h.form_submission_id = s.id
where s.version_closed is null and h.version_closed is null