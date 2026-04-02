CREATE TABLE virkailija.loppuselvitys_asiatarkastus_checklist (
  hakemus_id INTEGER PRIMARY KEY REFERENCES virkailija.hakemus(id),
  avustus_kaytetty_paatoksen_mukaisesti BOOLEAN NOT NULL DEFAULT FALSE,
  omarahoitus_kaytetty BOOLEAN NOT NULL DEFAULT FALSE,
  avustus_alle_100k BOOLEAN NOT NULL DEFAULT FALSE,
  ehtojen_mukaisesti_ei_epaselvyyksia BOOLEAN NOT NULL DEFAULT FALSE,
  kirjanpidon_paakirja_liitetty BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
