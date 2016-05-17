select *, s.answers->'value' as answer_values
from hakija.hakemukset h
  join hakija.form_submissions s on (h.form_submission_id = s.id and h.form_submission_version = s.version)
where h.hakemus_type=:hakemus_type
      and h.parent_id=:parent_id
      and h.status='submitted'
      and h.version_closed is null;