alter table arviot add column tags jsonb not null default '{"value":[]}';
comment on column arviot.tags is 'JSON containing arvio tags';
