create type haku_type as enum ('yleisavustus', 'erityisavustus');

alter table avustushaut add column haku_type haku_type default 'erityisavustus' not null;
alter table avustushaut alter column haku_type drop default;

alter table archived_avustushaut add column haku_type haku_type default 'erityisavustus' not null;
alter table archived_avustushaut alter column haku_type drop default;
