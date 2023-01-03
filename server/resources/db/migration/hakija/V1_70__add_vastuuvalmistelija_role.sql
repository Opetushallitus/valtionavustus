alter type role rename to role_temp;

create type role as enum ('presenting_officer', 'evaluator', 'vastuuvalmistelija');

alter table avustushaku_roles
alter column role type role using role::text::role;

drop type role_temp;

create unique index unique_vastuuvalmistelija_idx
on avustushaku_roles (avustushaku, role)
where (role = 'vastuuvalmistelija');
