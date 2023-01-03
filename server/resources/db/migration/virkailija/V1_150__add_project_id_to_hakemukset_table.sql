alter table hakija.hakemukset
add column if not exists project_id integer,
add constraint project_id_fk foreign key (project_id) references virkailija.va_code_values (id);

update hakija.hakemukset as h
set project_id = a.project_id
from hakija.avustushaut a
where a.project_id is not null
and h.avustushaku = a.id;
