CREATE TABLE lkp_tilit (
  id TEXT NOT NULL PRIMARY KEY,
  account INTEGER NOT NULL
);

INSERT INTO lkp_tilit (id, account)
VALUES ('kunta_kirkko', 82010000),
       ('liiketalous', 82310000),
       ('voittoa_tavoittelematon', 82510000),
       ('yliopisto', 82930000),
       ('valtio', 82980000),
       ('eu-maat', 82820000),
       ('ei-eu-maat', 82800000);

ALTER TABLE payments
ADD COLUMN sent_to_maksatuspalvelu_at TIMESTAMP;

CREATE OR REPLACE VIEW v_tasmaytysraportti_data AS
SELECT
  h.avustushaku AS avustushaku
  ,h.id AS hakemus
  ,v.code_value AS toimintayksikko
  ,h.organization_name AS toimittajan_nimi
  ,iban.value AS pankkitili
  ,p.payment_sum AS bruttosumma
  ,h.register_number AS pitka_viite
  ,t.account AS lkp_tili
  ,ar.talousarviotili AS takp_tili
  ,d.presenter_email AS asiatarkastaja
  ,d.acceptor_email AS hyvaksyja
  ,p.sent_to_maksatuspalvelu_at AS lahetetty_maksatuspalveluun
FROM virkailija.payments p
JOIN hakija.hakemukset h ON h.id = p.application_id
JOIN virkailija.arviot ar ON ar.hakemus_id = h.id
JOIN hakija.avustushaut a ON a.id = h.avustushaku
JOIN virkailija.va_code_values v ON v.id = a.operational_unit_id
JOIN virkailija.payment_batches b ON b.id = p.batch_id
JOIN virkailija.batch_documents d ON d.batch_id = b.id
LEFT JOIN (
  SELECT id, version, elem->>'value' as value
  FROM hakija.form_submissions f, jsonb_array_elements(answers->'value') elem
  WHERE f.version_closed IS NULL
  AND elem->>'key' = 'bank-iban'
) AS iban ON (h.form_submission_id = iban.id AND h.form_submission_version = iban.version)
LEFT JOIN (
  SELECT id, version, elem->>'value' as value
  FROM hakija.form_submissions f, jsonb_array_elements(answers->'value') elem
  WHERE f.version_closed IS NULL
  AND elem->>'key' = 'radioButton-0'
) AS lkp ON (h.form_submission_id = lkp.id AND h.form_submission_version = lkp.version)
JOIN virkailija.lkp_tilit t ON t.id = lkp.value
WHERE p.version_closed IS NULL
AND p.deleted IS NULL
AND h.version_closed IS NULL
ORDER BY h.avustushaku DESC, h.id DESC;

CREATE TABLE tasmaytysraportit (
  tasmaytysraportti_date TEXT PRIMARY KEY,
  contents BYTEA NOT NULL,
  created_at DATE NOT NULL,
  mailed_at TIMESTAMP,
  mailed_to TEXT
);
