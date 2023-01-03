DROP TRIGGER set_timestamp ON hakemus;
DROP FUNCTION trigger_set_timestamp;
DROP TABLE hakemus;

CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE hakemus (
  id integer primary key,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_hakemus_updated_at_timestamp
BEFORE UPDATE ON hakemus
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_timestamp();

INSERT INTO hakemus ( id )
SELECT DISTINCT(id) FROM hakija.hakemukset;

CREATE OR REPLACE FUNCTION insert_id_to_hakemus()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO virkailija.hakemus(id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_hakemukset_create_insert_id_to_hakemus
BEFORE INSERT ON hakija.hakemukset 
FOR EACH ROW
EXECUTE PROCEDURE insert_id_to_hakemus();

ALTER TABLE hakija.hakemukset ADD FOREIGN KEY(id) REFERENCES hakemus(id);

DROP TABLE muutoshakemus;

CREATE TABLE muutoshakemus (
  id              serial primary key,
  hakemus_id      integer UNIQUE NOT NULL,

  haen_kayttoajan_pidennysta          boolean,
  kayttoajan_pidennys_perustelut      text,
  haettu_kayttoajan_paattymispaiva    date,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CHECK ( haen_kayttoajan_pidennysta = false OR (kayttoajan_pidennys_perustelut is not null AND haettu_kayttoajan_paattymispaiva is not null) ),

  FOREIGN KEY (hakemus_id) REFERENCES hakemus (id)
);

CREATE TABLE normalized_hakemus (
  id serial PRIMARY KEY,

  hakemus_id integer UNIQUE NOT NULL,

  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,

  project_name TEXT NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (hakemus_id) REFERENCES hakemus (id)
);

CREATE TRIGGER update_muutoshakemus_updated_at_timestamp
BEFORE UPDATE ON muutoshakemus
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_timestamp();

CREATE TRIGGER update_normalized_hakemus_updated_at_timestamp
BEFORE UPDATE ON normalized_hakemus
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_timestamp();
