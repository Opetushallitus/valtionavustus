create table hakija.environment (
  id serial primary key,
  notice jsonb not null,
  constraint environment_id_one_row_only check (id = 1)
);

insert into hakija.environment
values (1, '{"fi": "", "sv": ""}');
