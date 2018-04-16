SELECT
  h.id, h.created_at, h.version, h.budget_total, h.budget_oph_share,
  h.organization_name, h.project_name, h.register_number, h.language,
  h.avustushaku AS grant_id, s.answers->'value' AS answers
FROM
  hakija.hakemukset h
JOIN
  hakija.form_submissions s
    ON (h.form_submission_id = s.id AND h.form_submission_version = s.version)
JOIN
  virkailija.arviot a
    ON (h.id = a.hakemus_id)
LEFT JOIN
  virkailija.payments p
    ON (p.application_id = h.id AND p.application_version = h.version
        AND p.version_closed IS NULL AND p.deleted IS NULL)
WHERE
  h.avustushaku = :grant_id
  AND h.status != 'cancelled'
  AND h.status != 'new'
  AND h.status != 'draft'
  AND h.refused IS NOT TRUE
  AND a.should_pay IS NOT FALSE
  AND h.version_closed IS NULL
  AND h.hakemus_type = 'hakemus'
  AND (p.state < 2 OR p.state IS NULL)
ORDER BY
  upper(h.organization_name), upper(h.project_name);
