SELECT
  SUM(a.budget_granted) AS total_granted,
  COUNT(p.id) AS count
FROM
  hakija.hakemukset AS h
JOIN
  virkailija.payments p
  ON
    (p.application_id = h.id AND p.version_closed IS NULL AND
     p.deleted IS NULL AND p.batch_number = :batch_number)
JOIN
  virkailija.arviot a ON a.hakemus_id = p.application_id
WHERE
  h.avustushaku = :grant_id AND h.version_closed IS NULL;
