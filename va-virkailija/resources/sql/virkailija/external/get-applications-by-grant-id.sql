SELECT
  h.id, h.language, h.avustushaku as grant_id, h.organization_name, h.project_name,
  h.user_first_name, h.user_last_name,
  coalesce(project_goals.value, project_nutshell.value) as nutshell,
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
  ) AS project_goals ON (h.form_submission_id = project_goals.id AND h.form_submission_version = project_goals.version)
LEFT JOIN
  (
    SELECT id, version, elem->>'value' as value
    FROM hakija.form_submissions f, jsonb_array_elements(answers->'value') elem
    WHERE f.version_closed IS NULL
    AND elem->>'key' = 'project-nutshell'
  ) AS project_nutshell ON (h.form_submission_id = project_nutshell.id AND h.form_submission_version = project_nutshell.version)
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
LEFT JOIN
  hakija.avustushaut ah ON h.avustushaku = ah.id
WHERE
  h.avustushaku = :grant_id
  AND h.hakemus_type = 'hakemus'
  AND h.version_closed IS NULL
  AND a.status = 'accepted'
  AND a.allow_visibility_in_external_system = true
  AND ah.allow_visibility_in_external_system = true
ORDER BY
  h.id ASC;
