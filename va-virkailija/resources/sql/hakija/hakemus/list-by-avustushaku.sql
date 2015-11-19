select h.id, h.organization_name, h.project_name, h.status, h.budget_total, h.budget_oph_share,
  s.answers->'value' as answer_values, h.user_key, h.register_number
from hakija.hakemukset h
  join hakija.form_submissions s on (h.form_submission_id = s.id and h.form_submission_version = s.version)
where h.avustushaku = :avustushaku_id
      and h.status != 'cancelled'
      and h.status != 'new'
      and h.version_closed is null
order by upper(h.organization_name), upper(h.project_name)
