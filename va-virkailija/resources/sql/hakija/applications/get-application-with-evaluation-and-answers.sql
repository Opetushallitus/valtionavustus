SELECT
  h.id, h.created_at, h.version, h.budget_total, h.budget_oph_share,
  h.organization_name, h.project_name, h.register_number, h.language,
  s.answers->'value' AS answers, a.budget_granted, a.costs_granted
FROM
  hakija.hakemukset h
JOIN
  hakija.form_submissions s
    ON (h.form_submission_id = s.id AND h.form_submission_version = s.version)
JOIN
  virkailija.arviot a
    ON (h.id = a.hakemus_id)
WHERE
  h.id = :application_id
  AND h.status != 'cancelled'
  AND h.status != 'new'
  AND h.version_closed IS NULL
  AND h.hakemus_type = 'hakemus'
ORDER BY
  upper(h.organization_name), upper(h.project_name);
