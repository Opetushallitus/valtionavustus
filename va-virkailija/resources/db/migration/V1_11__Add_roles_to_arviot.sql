alter table arviot add column presenter_role_id integer;
comment on column arviot.presenter_role_id is 'Presenter role id';

alter table arviot add column roles jsonb not null default '{"evaluators":[]}';
comment on column arviot.roles is 'JSON containing arvio roles';
