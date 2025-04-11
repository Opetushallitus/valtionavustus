select
    h.id,
    h.version,
    h.created_at,
    h.organization_name,
    h.project_name,
    h.language,
    h.status,
    h.budget_total,
    h.budget_oph_share,
    s.answers->'value' as answer_values,
    h.register_number,
    h.status_loppuselvitys,
    h.status_valiselvitys
from
    hakija.hakemukset h
    join hakija.form_submissions s on (h.form_submission_id = s.id and h.form_submission_version = s.version)
where
    h.avustushaku = :avustushaku_id
    and h.status in ('submitted', 'pending_change_request', 'officer_edit', 'applicant_edit')
    and h.version_closed is null
    and h.hakemus_type = :hakemus_type
order by h.register_number
