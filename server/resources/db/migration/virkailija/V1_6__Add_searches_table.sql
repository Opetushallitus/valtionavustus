create table searches (
    id             serial PRIMARY KEY,
    avustushaku_id integer not null,
    query          jsonb not null,
    name           varchar(512) not null,
    created_by     varchar(64) not null,
    created_at     timestamp with time zone not null default now(),
    modified_at    timestamp with time zone not null default now()
);

comment on table searches is 'Saved searches for listing certain applications (hakemus) of certain avustushaku';
comment on column searches.name is 'Human-readable name for the saved search';
comment on column searches.created_by is 'oid of user that has saved the search';

create index on searches (id, avustushaku_id);
create index on searches (avustushaku_id, query);
