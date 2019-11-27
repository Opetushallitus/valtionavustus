SELECT id, tyyppi, avustushaku_id, created_at, user_name, user_oid

FROM virkailija.tapahtumaloki

WHERE avustushaku_id = :avustushaku_id AND tyyppi = :tyyppi

ORDER BY created_at DESC;
