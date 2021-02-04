create table hakemus_paatokset_views (
  id             serial primary key,
  hakemus_id       integer NOT NULL,
  view_time  timestamp with time zone default now(),
  headers JSONB,
  remote_addr varchar(100)
);

create index on hakemus_paatokset_views (hakemus_id);