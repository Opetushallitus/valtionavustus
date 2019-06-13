SELECT
  h.id, h.organization_name, h.project_name,
  nutshell.value as nutshell,
  partners.value as partners,
  project_begin.value as project_begin,
  project_end.value as project_end,
  a.budget_granted, a.costs_granted
FROM
  hakija.hakemukset h
JOIN
  virkailija.arviot a
  ON a.hakemus_id = h.id
LEFT JOIN
  (
    SELECT id, version, elem->>'value' as value
    FROM hakija.form_submissions f, jsonb_array_elements(answers->'value') elem
    WHERE f.version_closed IS NULL
    AND elem->>'key' = 'project-goals'
  ) AS nutshell ON (h.form_submission_id = nutshell.id AND h.form_submission_version = nutshell.version)
LEFT JOIN
  (
    SELECT id, version, elem->>'value' AS value
    FROM hakija.form_submissions f, jsonb_array_elements(answers->'value') elem
    WHERE f.version_closed IS NULL
    AND elem->>'key' = 'other-partners'
  ) AS partners ON (h.form_submission_id = partners.id AND h.form_submission_version = partners.version)
LEFT JOIN
  (
    SELECT id, version, elem->>'value' AS value
    FROM hakija.form_submissions f, jsonb_array_elements(answers->'value') elem
    WHERE f.version_closed IS NULL
    AND elem->>'key' = 'project-begin'
  ) AS project_begin ON (h.form_submission_id = project_begin.id AND h.form_submission_version = project_begin.version)
LEFT JOIN
  (
    SELECT id, version, elem->>'value' AS value
    FROM hakija.form_submissions f, jsonb_array_elements(answers->'value') elem
    WHERE f.version_closed IS NULL
    AND elem->>'key' = 'project-end'
  ) AS project_end ON (h.form_submission_id = project_end.id AND h.form_submission_version = project_end.version)
WHERE
  h.avustushaku = :grant_id
  AND h.hakemus_type = 'hakemus'
  AND h.version_closed IS NULL
  AND a.status = 'accepted'
ORDER BY
  h.id ASC;
