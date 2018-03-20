INSERT INTO virkailija.payments (id, version, application_id,
  application_version, state, user_name, user_oid, batch_id, payment_sum)
VALUES(
  NEXTVAL('virkailija.payments_id_seq'), 0,
  :application_id, :application_version, :state, :user_name, :user_oid,
  :batch_id, :payment_sum)
RETURNING id, version, application_id, application_version, state, batch_id,
          payment_sum;
