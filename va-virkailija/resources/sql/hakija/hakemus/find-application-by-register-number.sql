SELECT
  id, created_at, version, budget_total, budget_oph_share,
  organization_name, project_name, register_number, language,
  avustushaku AS grant_id, refused, refused_comment, refused_at
FROM
  hakija.hakemukset
WHERE
  register_number = :register_number
  AND version_closed IS NULL
ORDER
  BY id DESC
LIMIT 1
