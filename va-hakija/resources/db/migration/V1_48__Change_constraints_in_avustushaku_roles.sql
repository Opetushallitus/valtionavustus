delete from hakija.avustushaku_roles where id = 1;

alter table hakija.avustushaku_roles
alter email drop not null,
alter oid set not null,
alter created_at set not null,
add constraint avustushaku_roles_avustushaku_oid_contraint unique (avustushaku, oid);
