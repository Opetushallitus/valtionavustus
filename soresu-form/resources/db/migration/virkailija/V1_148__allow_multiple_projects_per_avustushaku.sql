create table avustushaku_project_code (
  id serial primary key,
  avustushaku_id  integer not null,
  project_id integer not null,
  foreign key (avustushaku_id) references hakija.avustushaut (id),
  foreign key (project_id) references virkailija.va_code_values (id)
);

insert into avustushaku_project_code (avustushaku_id, project_id)
select id, project_id from avustushaut
where project_id is not null;
