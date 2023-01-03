create table muutoshakemus_status (
  status text primary key,
  description text
);

insert into muutoshakemus_status (status, description)
values
  ('new', 'Muutoshakemus arrived and not processed'),
  ('accepted', 'Muutoshakemus accepted'),
  ('refused', 'Muutoshakemus refused');

alter table muutoshakemus
add column status text default 'new' not null,
add constraint fk_status
  foreign key (status)
  references muutoshakemus_status (status);
