SELECT
  payments.*, hakemukset.organization_name, hakemukset.project_name,
  avustushaut.content AS grant_content
FROM
  payments
LEFT JOIN
  hakemukset
  ON
    hakemukset.id = payments.application_id
    AND hakemukset.version = payments.application_version
LEFT JOIN
  avustushaut
  ON
    avustushaut.id = payments.grant_id
WHERE payments.grant_id = :grant_id

