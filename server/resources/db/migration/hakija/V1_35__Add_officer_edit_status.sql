alter type status rename to old_status;
create type status as enum ('new', 'draft', 'submitted', 'pending_change_request', 'officer_edit', 'cancelled');
alter table hakemukset alter column status drop default;
alter table hakemukset alter column status type status using status::text::status ;
alter table hakemukset alter column status set default 'new';
drop type old_status;
