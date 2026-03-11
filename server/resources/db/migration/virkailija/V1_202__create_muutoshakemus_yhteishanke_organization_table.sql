CREATE TABLE virkailija.muutoshakemus_yhteishanke_organization (
  id serial PRIMARY KEY,
  muutoshakemus_id integer NOT NULL REFERENCES virkailija.muutoshakemus(id) ON DELETE CASCADE,
  position integer NOT NULL,
  organization_name text NOT NULL,
  contact_person text NOT NULL,
  email text NOT NULL
);

CREATE INDEX idx_muutoshakemus_yhteishanke_organization_muutoshakemus_id
  ON virkailija.muutoshakemus_yhteishanke_organization(muutoshakemus_id);
