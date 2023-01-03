SELECT
  name, email, role
FROM
  avustushaku_roles
WHERE
  avustushaku = :avustushaku
ORDER BY id DESC
