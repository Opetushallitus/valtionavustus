SELECT
  id, created_at, version, budget_total, budget_oph_share,
  organization_name, project_name, register_number, parent_id, language,
  avustushaku AS grant_id, refused, refused_comment, refused_at
FROM
  hakija.hakemukset
WHERE
  register_number = :register_number
  AND status != 'cancelled'
  AND status != 'new'
  AND status != 'draft'
  AND hakemus_type = 'hakemus'
  AND version_closed IS NULL
ORDER
  BY id DESC
LIMIT 1
