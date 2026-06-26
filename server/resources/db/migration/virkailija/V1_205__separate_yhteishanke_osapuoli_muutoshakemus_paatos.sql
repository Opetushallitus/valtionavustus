-- Yhteishankkeen osapuolimuutokset omaksi osiokseen: oma perustelu hakijalle ja
-- oma hyväksy/hylkää-päätös virkailijalle, erillään sisältömuutoksesta.

ALTER TABLE virkailija.muutoshakemus
  ADD COLUMN yhteishanke_osapuoli_perustelut text;

CREATE TABLE virkailija.paatos_yhteishanke_osapuoli (
  paatos_id integer PRIMARY KEY REFERENCES virkailija.paatos (id),
  status virkailija.paatos_type NOT NULL
);

-- Backfill: aiemmin päätetyt osapuolimuutokset kantoivat päätöksensä paatos_sisaltomuutos-taulussa
-- ja perustelunsa sisaltomuutos_perustelut-sarakkeessa.
INSERT INTO virkailija.paatos_yhteishanke_osapuoli (paatos_id, status)
SELECT ps.paatos_id, ps.status
FROM virkailija.paatos_sisaltomuutos ps
JOIN virkailija.muutoshakemus m ON m.paatos_id = ps.paatos_id
WHERE EXISTS (SELECT 1 FROM virkailija.muutoshakemus_yhteishanke_organization o
              WHERE o.muutoshakemus_id = m.id);

UPDATE virkailija.muutoshakemus m
SET yhteishanke_osapuoli_perustelut = m.sisaltomuutos_perustelut
WHERE EXISTS (SELECT 1 FROM virkailija.muutoshakemus_yhteishanke_organization o
              WHERE o.muutoshakemus_id = m.id);
