alter table arviot add column status_changelog jsonb not null default '[]';
comment on column arviot.status_changelog is 'JSON array containing the status changelog';

