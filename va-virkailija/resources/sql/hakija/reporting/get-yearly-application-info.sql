SELECT
  EXTRACT(YEAR FROM created_at) AS year,
  COUNT(id) AS count,
  SUM(budget_total) AS budget_total,
  SUM(budget_oph_share) AS budget_oph_share
FROM
  hakija.hakemukset
WHERE
  status = 'submitted'
  AND version_closed IS NULL
  AND hakemus_type = 'hakemus'
GROUP BY
  year
ORDER BY
  year;

