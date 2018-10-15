SELECT
  h.id, h.avustushaku AS avustushaku_id, h.budget_total, h.budget_oph_share,
  h.organization_name, h.project_name, h.register_number,
  a.content#>'{name}' AS avustushaku_name,
  a.content#>'{duration, start}' AS avustushaku_start,
  a.content#>'{duration, end}' AS avustushaku_end,
  a.decision#>'{date}' AS avustushaku_decision_date
FROM
  hakija.hakemukset h
LEFT JOIN
  hakija.avustushaut a
    ON a.id = h.avustushaku
WHERE
  h.hakemus_type = 'hakemus'
  AND h.version_closed IS NULL
  AND h.status_loppuselvitys = 'missing'
  AND h.status != 'new'
  AND h.status != 'cancelled'
  AND h.status != 'draft'
ORDER BY
  h.id;
