SELECT
  COUNT(*), EXTRACT(YEAR FROM created_at) AS year
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

