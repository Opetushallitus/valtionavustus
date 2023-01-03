SELECT
  EXTRACT(YEAR FROM created_at) AS year,
  COUNT(id) AS count
FROM
  hakija.hakemukset
WHERE
  (status = 'submitted' OR status = 'officer_edit')
  AND version_closed IS NULL
  AND hakemus_type = 'hakemus'
GROUP BY
  year
ORDER BY
  year;
