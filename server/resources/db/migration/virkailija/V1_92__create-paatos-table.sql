DROP TRIGGER update_muutoshakemus_updated_at_timestamp on muutoshakemus;
DROP TABLE muutoshakemus;
DROP TABLE muutoshakemus_status;

CREATE TYPE paatos_type AS ENUM (
  'accepted',
  'refused'
  );

CREATE TABLE paatos (
  id                    serial PRIMARY KEY,
  paatos                paatos_type NOT NULL,
  user_key              varchar(64) NOT NULL,
  perustelut            TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE muutoshakemus (
  id              serial primary key,
  hakemus_id      integer UNIQUE NOT NULL,
  paatos_id       integer UNIQUE,

  haen_kayttoajan_pidennysta          boolean,
  kayttoajan_pidennys_perustelut      text,
  haettu_kayttoajan_paattymispaiva    date,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CHECK ( haen_kayttoajan_pidennysta = false OR (kayttoajan_pidennys_perustelut is not null AND haettu_kayttoajan_paattymispaiva is not null) ),

  FOREIGN KEY (hakemus_id) REFERENCES hakemus (id),
  FOREIGN KEY (paatos_id) REFERENCES paatos (id)
);

CREATE TRIGGER update_muutoshakemus_updated_at_timestamp
BEFORE UPDATE ON muutoshakemus
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_timestamp();

CREATE TRIGGER update_paatos_updated_at_timestamp
BEFORE UPDATE ON paatos
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_timestamp();
