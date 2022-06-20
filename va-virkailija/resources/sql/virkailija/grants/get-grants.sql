SELECT
  h.id, h.created_at, h.form, h.status, h.register_number, h.valiselvitysdate,
  h.loppuselvitysdate, h.form_loppuselvitys, h.form_valiselvitys,
  h.is_academysize, h.haku_type, operational_unit_id, project_id, operation_id,
<<<<<<< Updated upstream
  h.allow_visibility_in_external_system, h.arvioitu_maksupaiva
=======
  h.allow_visibility_in_external_system
>>>>>>> Stashed changes
FROM
  hakija.avustushaut h
WHERE
  h.status != 'deleted';
