select h.organization_name, h.project_name, h.status, h.budget_oph_share, s.answers->'value' as answer_values
from hakija.hakemukset h
  join hakija.form_submissions s on h.form_submission_id = s.id
where h.avustushaku = :avustushaku_id and s.version_closed is null and h.version_closed is null
