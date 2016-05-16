alter table hakija.avustushaut add column form_loppuselvitys integer references forms(id);
alter table hakija.avustushaut add column form_valiselvitys integer references forms(id);
alter table hakija.hakemukset add column hakemus_type VARCHAR(20) DEFAULT 'hakemus';
alter table hakija.hakemukset add column parent_id integer;

create index on hakija.hakemukset(hakemus_type,parent_id);