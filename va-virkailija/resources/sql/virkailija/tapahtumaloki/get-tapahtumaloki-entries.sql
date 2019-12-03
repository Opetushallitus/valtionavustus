SELECT id, tyyppi, created_at, avustushaku_id, hakemus_id, batch_id, emails, success, user_name, user_oid

FROM virkailija.tapahtumaloki

WHERE avustushaku_id = :avustushaku_id AND tyyppi = :tyyppi;
