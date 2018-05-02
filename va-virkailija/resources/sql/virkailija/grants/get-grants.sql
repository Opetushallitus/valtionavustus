SELECT
  h.id, h.created_at, h.form, h.status, h.register_number, h.valiselvitysdate,
  h.loppuselvitysdate, h.form_loppuselvitys, h.form_valiselvitys,
  h.is_academysize, h.haku_type, operational_unit_id, project_id, operation_id
FROM
  hakija.avustushaut h
WHERE
  h.status != 'deleted';
