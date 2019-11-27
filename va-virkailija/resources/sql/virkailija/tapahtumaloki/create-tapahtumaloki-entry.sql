INSERT INTO virkailija.tapahtumaloki (id, tyyppi, avustushaku_id, user_name, user_oid)
VALUES(
  NEXTVAL('virkailija.tapahtumaloki_id_seq'),
  :tyyppi,
  :avustushaku_id,
  :user_name,
  :user_oid
)
RETURNING id
