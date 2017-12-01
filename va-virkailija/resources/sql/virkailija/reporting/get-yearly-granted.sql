SELECT
  EXTRACT(YEAR FROM h.created_at) AS year,
  SUM(budget_granted) AS bugdet_granted,
  SUM(costs_granted) AS costs_granted
FROM
  hakija.hakemukset h
JOIN
  virkailija.arviot a
    ON (a.hakemus_id = h.id AND a.status = 'accepted')
WHERE
  h.status = 'submitted'
  AND h.version_closed IS NULL
  AND h.hakemus_type = 'hakemus'
GROUP BY
  year
ORDER BY
  year;
