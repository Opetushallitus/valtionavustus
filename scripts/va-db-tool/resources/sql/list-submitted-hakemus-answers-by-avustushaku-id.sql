select
    h.id,
    h.version,
    fs.answers
from
    hakija.hakemukset h
    left join hakija.form_submissions fs on h.form_submission_id = fs.id and h.form_submission_version = fs.version
where
    h.avustushaku = :avustushaku_id and
    h.version_closed is null and
    h.hakemus_type = 'hakemus' and
    h.status = 'submitted'
