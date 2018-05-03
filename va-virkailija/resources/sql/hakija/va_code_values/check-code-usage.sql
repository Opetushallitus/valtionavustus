SELECT
  COUNT(id) > 0 AS used
FROM
  hakija.avustushaut a
WHERE
  a.operational_unit_id = :id OR a.project_id = :id OR a.operation_id = :id
LIMIT
  1;
