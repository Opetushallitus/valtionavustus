SELECT
  EXTRACT(YEAR FROM (content#>>'{duration, start}')::timestamp) AS year,
  SUM((content->>'total-grant-size')::INTEGER) AS total_grant_size
FROM
  hakija.avustushaut
GROUP BY
  year
ORDER BY
  year
