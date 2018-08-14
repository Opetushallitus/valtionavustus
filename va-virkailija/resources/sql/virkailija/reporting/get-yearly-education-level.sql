SELECT
  EXTRACT(YEAR FROM (changelog#>>'{0, timestamp}')::timestamp) AS year,
  rahoitusalue AS education_level, COUNT(*) AS total_count
FROM
  virkailija.arviot
WHERE
  status = 'accepted' AND rahoitusalue IS NOT NULL
GROUP BY
  year, rahoitusalue
ORDER BY
  year;
