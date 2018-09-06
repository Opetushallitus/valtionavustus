SELECT
  h.id, h.created_at, h.version, h.budget_total, h.budget_oph_share,
  h.organization_name, h.project_name, h.register_number, h.parent_id,
  h.language, h.avustushaku AS grant_id, h.refused, h.refused_comment,
  h.refused_at, a.content#>'{name, fi}' AS grant_name
FROM
  hakija.hakemukset h
LEFT JOIN
  hakija.avustushaut a
    ON a.id = h.avustushaku
WHERE
  h.version_closed IS NULL
  AND
    (h.register_number LIKE :search_term
    OR LOWER(h.project_name) LIKE :search_term
    OR LOWER(h.organization_name) LIKE :search_term)
ORDER BY
  created_at DESC
