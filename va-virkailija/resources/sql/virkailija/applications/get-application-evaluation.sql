SELECT
   a.budget_granted, a.costs_granted,
   replace(a.talousarviotili, '.', '') AS takp_account,
   status, should_pay
FROM
  virkailija.arviot a
WHERE
  a.hakemus_id = :application_id
