SELECT
  EXTRACT(YEAR FROM created_at) AS year,
  COUNT(id) AS count
FROM
  hakija.avustushaut
WHERE
  status = 'resolved'
GROUP BY
  year
ORDER BY
  year;
