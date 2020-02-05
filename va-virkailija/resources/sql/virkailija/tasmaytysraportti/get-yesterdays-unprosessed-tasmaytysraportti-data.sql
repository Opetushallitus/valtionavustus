SELECT
  *, TO_CHAR((current_date - 1) :: DATE, 'dd.mm.yyyy') AS tasmaytysraportti_date
FROM
  v_tasmaytysraportti_data
WHERE
  (date_trunc('day', lahetetty_maksatuspalveluun) between date_trunc('day', current_date - 1) and date_trunc('day', current_date - 1))
AND NOT EXISTS (
  SELECT 1
  FROM tasmaytysraportit t
  WHERE t.tasmaytysraportti_date = TO_CHAR((current_date - 1) :: DATE, 'dd.mm.yyyy')
)
