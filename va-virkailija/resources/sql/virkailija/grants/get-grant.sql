SELECT
  h.id, h.created_at, h.form, h.content, h.status, h.register_number,
  h.valiselvitysdate, h.loppuselvitysdate, h.form_loppuselvitys,
  h.form_valiselvitys, h.is_academysize, h.haku_type, h.operational_unit_id,
  pu.code AS operational_unit, h.project_id,  p.code AS project,
  h.operation_id, o.code AS operation
FROM
  hakija.avustushaut h
LEFT JOIN
  virkailija.va_code_values pu
    ON (pu.id = h.operational_unit_id AND pu.deleted IS NULL)
LEFT JOIN
  virkailija.va_code_values p
    ON (p.id = h.project_id AND p.deleted IS NULL)
LEFT JOIN
  virkailija.va_code_values o
    ON (o.id = h.operation_id AND o.deleted IS NULL)
WHERE
  h.id = :grant_id;
