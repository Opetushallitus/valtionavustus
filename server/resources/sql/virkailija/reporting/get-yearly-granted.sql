SELECT
  EXTRACT(YEAR FROM (changelog#>>'{0, timestamp}')::timestamp) AS year,
  SUM(budget_granted) AS budget_granted,
  SUM(costs_granted) AS costs_granted
FROM
  virkailija.arviot
WHERE
  status = 'accepted'
GROUP BY
  year
ORDER BY
  year;
