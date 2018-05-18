SELECT
  id, created_at, version, budget_total, budget_oph_share, organization_name,
  project_name, register_number, language,  avustushaku AS grant_id, refused,
  refused_comment, refused_at
FROM
  hakija.hakemukset
WHERE
  version_closed IS NULL
  AND
    (register_number LIKE :search_term
    OR LOWER(project_name) LIKE :search_term
    OR LOWER(organization_name) LIKE :search_term)
