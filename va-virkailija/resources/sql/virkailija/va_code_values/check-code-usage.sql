SELECT
  COUNT(id) > 0 AS used
FROM
  hakija.avustushaut a
WHERE
  a.operational_unit = :id OR a.project = :id OR a.operation = :id
LIMIT
  1;
