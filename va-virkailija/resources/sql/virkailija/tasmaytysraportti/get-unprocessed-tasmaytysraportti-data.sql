SELECT
  *, TO_CHAR(d.lahetetty_maksatuspalveluun, 'dd.mm.yyyy') AS tasmaytysraportti_date
FROM
  virkailija.v_tasmaytysraportti_data d
WHERE
  date_trunc('day', d.lahetetty_maksatuspalveluun) between date '2019-10-01' AND date_trunc('day', current_date - 1)
AND NOT EXISTS (
  SELECT 1
  FROM virkailija.tasmaytysraportit t
  WHERE t.tasmaytysraportti_date = TO_CHAR(d.lahetetty_maksatuspalveluun, 'dd.mm.yyyy')
)
