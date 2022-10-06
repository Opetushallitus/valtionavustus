SELECT
  h.id, h.created_at, h.version, h.budget_total, h.budget_oph_share,
  h.organization_name, h.project_name, h.register_number, h.language,
  h.avustushaku AS grant_id, s.answers->'value' AS answers, refused,
  refused_comment, refused_at, codes.code as project_code
FROM
  hakija.hakemukset h
JOIN
  hakija.form_submissions s
    ON (h.form_submission_id = s.id AND h.form_submission_version = s.version)
LEFT JOIN
  virkailija.va_code_values codes
    ON (codes.id = h.project_id)
WHERE
  h.id = :application_id
  AND h.status != 'cancelled'
  AND h.status != 'new'
  AND h.status != 'draft'
  AND h.version_closed IS NULL
  AND h.hakemus_type = 'hakemus'
ORDER BY
  upper(h.organization_name), upper(h.project_name);
