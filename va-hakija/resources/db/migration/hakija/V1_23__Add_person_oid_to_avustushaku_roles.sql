alter table avustushaku_roles add column oid varchar(64);

comment on column avustushaku_roles.oid is 'employeenumber in LDAP. This is null for old, manually added records, so they cannot be used for authorization';
