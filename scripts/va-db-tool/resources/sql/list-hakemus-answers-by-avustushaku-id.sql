select
    h.id as hakemus_id,
    h.version as hakemus_version,
    fs.answers as answers,
    fs.id as form_submission_id,
    fs.version as form_submission_version
from
    hakija.hakemukset h
    left join hakija.form_submissions fs on h.form_submission_id = fs.id and h.form_submission_version = fs.version
where
    h.avustushaku = :avustushaku_id and
    h.version_closed is null and
    h.hakemus_type = 'hakemus'
