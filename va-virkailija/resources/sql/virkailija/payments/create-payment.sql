INSERT INTO virkailija.payments (id, version, application_id,
  application_version, paymentstatus_id, user_name, user_oid, batch_id, payment_sum, phase, pitkaviite, project_code)
VALUES(
  NEXTVAL('virkailija.payments_id_seq'), 0,
  :application_id, :application_version, :paymentstatus_id, :user_name, :user_oid,
  :batch_id, :payment_sum, :phase, :pitkaviite, :project_code)
RETURNING id, version, application_id, application_version, paymentstatus_id, batch_id,
          payment_sum, phase, pitkaviite, project_code;
