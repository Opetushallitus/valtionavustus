SELECT
  *, TO_CHAR((current_date) :: DATE, 'dd.mm.yyyy') AS tasmaytysraportti_date
FROM
  v_tasmaytysraportti_data
WHERE
  avustushaku = :avustushaku_id;
