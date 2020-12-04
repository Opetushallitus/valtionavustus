SELECT
  EXTRACT(YEAR FROM (changelog#>>'{0, timestamp}')::timestamp) AS year, COUNT(id)
FROM
  virkailija.arviot
WHERE
  status = :status::arvio_status
GROUP BY
  year
ORDER BY
  year;
