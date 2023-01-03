CREATE TABLE virkailija.menoluokka (
  id             serial primary key,
  avustushaku_id integer NOT NULL,

  type           text NOT NULL,
  translation_fi text NOT NULL,
  translation_se text,

  created_at     timestamp with time zone NOT NULL default now(),
  UNIQUE (avustushaku_id, type),
  FOREIGN KEY (avustushaku_id) REFERENCES hakija.avustushaut (id)
);

CREATE TABLE virkailija.menoluokka_hakemus (
  id            serial primary key,
  menoluokka_id integer NOT NULL,
  hakemus_id    integer NOT NULL,
  amount        integer NOT NULL,
  UNIQUE (hakemus_id, menoluokka_id),
  FOREIGN KEY (menoluokka_id) REFERENCES virkailija.menoluokka (id),
  FOREIGN KEY (hakemus_id) REFERENCES virkailija.hakemus (id)
);

CREATE TABLE virkailija.menoluokka_muutoshakemus (
  id               serial primary key,
  menoluokka_id    integer NOT NULL,
  muutoshakemus_id integer NOT NULL,
  amount           integer NOT NULL,
  UNIQUE (muutoshakemus_id, menoluokka_id),
  FOREIGN KEY (menoluokka_id) REFERENCES virkailija.menoluokka (id),
  FOREIGN KEY (muutoshakemus_id) REFERENCES virkailija.muutoshakemus (id)
);

CREATE TABLE virkailija.menoluokka_paatos (
  id            serial primary key,
  menoluokka_id integer NOT NULL,
  paatos_id     integer NOT NULL,
  amount        integer NOT NULL,
  UNIQUE (paatos_id, menoluokka_id),
  FOREIGN KEY (menoluokka_id) REFERENCES virkailija.menoluokka (id),
  FOREIGN KEY (paatos_id) REFERENCES virkailija.paatos (id)
);
