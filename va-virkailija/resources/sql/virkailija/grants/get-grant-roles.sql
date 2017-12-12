SELECT
  avustushaku AS grant_id, role, oid
FROM
  hakija.avustushaku_roles
WHERE
  avustushaku = :id;
