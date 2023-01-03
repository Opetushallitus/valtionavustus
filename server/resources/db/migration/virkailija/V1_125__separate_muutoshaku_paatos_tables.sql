-- separate table for jatkoaika päätös
create table paatos_jatkoaika (
  paatos_id integer primary key references paatos (id),
  status paatos_type not null,
  paattymispaiva date
);

-- migrate jatkoaika päätös data
insert into paatos_jatkoaika (paatos_id, status, paattymispaiva)
select paatos.id, status, paattymispaiva
from paatos
join muutoshakemus on muutoshakemus.paatos_id = paatos.id
where haen_kayttoajan_pidennysta;

-- add paatos status for sisältömuutos
alter table paatos_sisaltomuutos add column status paatos_type;
update paatos_sisaltomuutos set status = paatos.status
from paatos where paatos.id = paatos_sisaltomuutos.paatos_id;
alter table paatos_sisaltomuutos alter column status set not null;

-- separate table for talousarvio päätös
-- the actual talousarvio is found from menoluokka_paatos table using paatos_id
create table paatos_talousarvio (
  paatos_id integer primary key references paatos (id),
  status paatos_type not null
);

-- migrate talousarvio päätäs data
insert into paatos_talousarvio (paatos_id, status)
select paatos.id, status
from paatos
join muutoshakemus on muutoshakemus.paatos_id = paatos.id
where talousarvio_perustelut is not null;

-- drop extracted fields from paatos table
alter table paatos drop column paattymispaiva;
alter table paatos drop column status;