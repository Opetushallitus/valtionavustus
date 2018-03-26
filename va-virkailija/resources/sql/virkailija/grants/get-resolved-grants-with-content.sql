SELECT
  h.id, h.created_at, h.form, h.content, h.status, h.register_number,
  h.valiselvitysdate, h.loppuselvitysdate, h.form_loppuselvitys,
  h.form_valiselvitys, h.is_academysize, h.haku_type, h.operational_unit_id,
  pu.code AS operational_unit, h.project_id,  p.code AS project,
  h.operation_id, o.code AS operation
FROM
  avustushaut h
LEFT JOIN
  virkailija.va_code_values pu
    ON pu.id = h.operational_unit_id
LEFT JOIN
  virkailija.va_code_values p
    ON p.id = h.project_id
LEFT JOIN
  virkailija.va_code_values o
    ON o.id = h.operation_id
WHERE
  h.status = 'resolved' OR h.status = 'published'
ORDER
  BY h.created_at DESC;
