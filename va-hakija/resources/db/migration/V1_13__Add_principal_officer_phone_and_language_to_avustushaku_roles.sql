alter type role rename to old_role;
create type role as enum ('principal_officer', 'presenting_officer', 'evaluator');
alter table avustushaku_roles alter column role type role using role::text::role ;
drop type old_role;
update avustushaku_roles set role = 'principal_officer' where email = 'leena.koski@oph.fi';

alter table avustushaku_roles add column telephone varchar(64);
update avustushaku_roles set telephone = '029 533 1106' where email = 'leena.koski@oph.fi';
alter table avustushaku_roles alter column telephone set not null;

create type language as enum ('fi', 'sv');
alter table avustushaku_roles add column language language default 'fi' not null;

insert into avustushaku_roles (avustushaku, name, role, email, telephone, language) values (1, 'Helena Öhman', 'presenting_officer', 'helena.ohman@oph.fi', '029 533 1111', 'sv');
