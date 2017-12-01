SELECT
  EXTRACT(YEAR FROM h.created_at) AS year, COUNT(h.id)
FROM
  hakija.hakemukset h
JOIN
  virkailija.arviot a
    ON (a.hakemus_id = h.id AND a.status = :status::virkailija.status)
WHERE
  h.status = 'submitted'
  AND h.version_closed IS NULL
  AND h.hakemus_type = 'hakemus'
GROUP BY
  year
ORDER BY
  year;

