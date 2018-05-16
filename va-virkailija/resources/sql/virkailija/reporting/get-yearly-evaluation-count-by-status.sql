SELECT
  EXTRACT(YEAR FROM (changelog#>>'{0, timestamp}')::timestamp) AS year, COUNT(id)
FROM
  virkailija.arviot
WHERE
  status = :status::virkailija.status AND
  changelog -> 0 ? 'timestamp'
GROUP BY
  year
ORDER BY
  year;
