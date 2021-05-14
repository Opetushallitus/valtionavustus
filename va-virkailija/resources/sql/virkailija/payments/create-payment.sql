INSERT INTO virkailija.payments (id, version, application_id,
  application_version, paymentstatus_id, user_name, user_oid, batch_id, payment_sum, phase)
VALUES(
  NEXTVAL('virkailija.payments_id_seq'), 0,
  :application_id, :application_version, :paymentstatus_id, :user_name, :user_oid,
  :batch_id, :payment_sum, :phase)
RETURNING id, version, application_id, application_version, paymentstatus_id, batch_id,
          payment_sum, phase;
