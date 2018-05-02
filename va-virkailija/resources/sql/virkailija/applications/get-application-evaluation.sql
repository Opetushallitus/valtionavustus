SELECT
   a.budget_granted, a.costs_granted,
   replace(a.talousarviotili, '.', '') AS takp_account
FROM
  virkailija.arviot a
WHERE
  a.hakemus_id = :application_id
