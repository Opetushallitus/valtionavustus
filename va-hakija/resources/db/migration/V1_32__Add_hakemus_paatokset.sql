create table hakemus_paatokset (
  id             serial primary key,
  hakemus_id       integer NOT NULL,
  hakemus_version  integer NOT NULL,
  sent_time  timestamp with time zone default now(),
  sent_emails    jsonb not null,
  foreign key (hakemus_id, hakemus_version) references hakemukset(id, version),
  unique (hakemus_id, hakemus_version)
);
