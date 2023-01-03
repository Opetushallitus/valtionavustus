alter table arviot add column changelog jsonb not null default '[]';
comment on column arviot.changelog is 'JSON array containing the arvio changelog';

