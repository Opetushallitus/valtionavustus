alter type haku_status rename to old_haku_status;
create type haku_status as enum ('new', 'draft', 'published', 'resolved', 'deleted');
alter table avustushaut alter column status drop default;
alter table avustushaut alter column status type haku_status using status::text::haku_status ;
alter table archived_avustushaut alter column status type haku_status using status::text::haku_status ;
alter table avustushaut alter column status set default 'new';
drop type old_haku_status;
