alter type status rename to old_status;
create type status as enum ('unhandled', 'processing', 'plausible', 'rejected', 'accepted');
alter table arviot alter column status drop default;
alter table arviot alter column status type status using status::text::status ;
alter table arviot alter column status set default 'unhandled';
drop type old_status;
