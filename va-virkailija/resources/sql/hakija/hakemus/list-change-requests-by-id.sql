select h.id, h.organization_name, h.project_name, h.status, h.budget_total, h.budget_oph_share,
  s.answers->'value' as answer_values, h.user_key, h.register_number
from hakija.hakemukset h
  join hakija.form_submissions s on (h.form_submission_id = s.id and h.form_submission_version = s.version)
where h.id = :id and h.status = 'pending_change_request' and h.last_status_change_at = h.created_at
order by h.version
