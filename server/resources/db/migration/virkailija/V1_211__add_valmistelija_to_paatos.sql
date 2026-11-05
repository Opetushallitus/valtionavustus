ALTER TABLE virkailija.paatos
  ADD COLUMN valmistelija_name text,
  ADD COLUMN valmistelija_email text,
  ADD COLUMN valmistelija_oid text;

UPDATE virkailija.paatos p
SET valmistelija_name = r.name,
    valmistelija_email = r.email,
    valmistelija_oid = r.oid
FROM virkailija.muutoshakemus m
JOIN virkailija.arviot a ON a.hakemus_id = m.hakemus_id
JOIN hakija.avustushaku_roles r ON r.id = a.presenter_role_id
WHERE m.paatos_id = p.id;
