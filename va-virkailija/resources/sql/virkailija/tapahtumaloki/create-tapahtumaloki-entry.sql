INSERT INTO virkailija.tapahtumaloki (id, tyyppi, avustushaku_id, hakemus_id, batch_id, emails, success, user_name, user_oid)
VALUES(
  NEXTVAL('virkailija.tapahtumaloki_id_seq'),
  :tyyppi,
  :avustushaku_id,
  :hakemus_id,
  :batch_id,
  :emails,
  :success,
  :user_name,
  :user_oid
)
RETURNING id
