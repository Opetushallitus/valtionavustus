CREATE TABLE virkailija.yhteishanke_organization (
  id serial PRIMARY KEY,
  hakemus_id integer NOT NULL REFERENCES hakemus(id),
  organization_name text,
  contact_person text,
  email text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_yhteishanke_organization_hakemus_id
  ON virkailija.yhteishanke_organization(hakemus_id);
