alter table normalized_hakemus
add column organization_name text,
add column register_number text,
add column project_end text;

update normalized_hakemus set
  organization_name = 'Testi Firma Oy',
  register_number = '001/001/2020',
  project_end = '01.01.2021';

alter table normalized_hakemus
alter column organization_name set not null,
alter column register_number set not null,
alter column project_end set not null;
