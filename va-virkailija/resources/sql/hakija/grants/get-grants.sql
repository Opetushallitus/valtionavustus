SELECT
  id, created_at, form, status, register_number, valiselvitysdate,
  loppuselvitysdate, form_loppuselvitys, form_valiselvitys, is_academysize,
  haku_type
FROM
  avustushaut
WHERE
  status != 'deleted';
