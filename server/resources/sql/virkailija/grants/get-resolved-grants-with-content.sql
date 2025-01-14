SELECT
  h.id, h.created_at, h.form, h.content, h.status, h.register_number,
  h.valiselvitysdate, h.loppuselvitysdate, h.form_loppuselvitys,
  h.form_valiselvitys, h.is_academysize, h.haku_type, h.operational_unit_id,
  h.allow_visibility_in_external_system, h.arvioitu_maksupaiva
FROM
  hakija.avustushaut h
WHERE
  h.status = 'resolved' OR h.status = 'published'
ORDER
  BY h.created_at DESC;
