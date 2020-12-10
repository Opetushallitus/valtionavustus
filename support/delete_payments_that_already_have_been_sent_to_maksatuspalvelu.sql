create schema support;

create table support.payment_rows_to_delete_2020_12_09 as (
  with already_sent_payment_row as (
    select p.id, max(p.version) as version, p.phase, p.application_id
    from virkailija.payments p
    join virkailija.payment_batches b on p.batch_id = b.id
    where b.grant_id = 192
    group by p.id, p.phase, p.application_id
  ), recreated_already_sent_payment_row as (
    select p2.id, max(p2.version) as version
    from virkailija.payments p2
    join already_sent_payment_row r
    on p2.application_id = r.application_id
    where p2.phase = r.phase
    and deleted is null
    and version_closed is null
    group by p2.id
  )
  select p3.*
  from virkailija.payments p3
  join recreated_already_sent_payment_row r2 on p3.id = r2.id and p3.version = r2.version
);

create table support.payment_rows_to_undelete_2020_12_09 as (
  with already_sent_payment_row as (
    select p.id, max(p.version) as version, p.phase, p.application_id
    from virkailija.payments p
    join virkailija.payment_batches b on p.batch_id = b.id
    where b.grant_id = 192
    group by p.id, p.phase, p.application_id
  )
  select p3.*
  from virkailija.payments p3
  join already_sent_payment_row r2 on p3.id = r2.id and p3.version = r2.version
);

update virkailija.payments p
set version_closed = now()
from support.payment_rows_to_delete_2020_12_09 d
where p.id = d.id and p.version = d.version and p.deleted is not null;

update virkailija.payments p
set version_closed = now()
from support.payment_rows_to_undelete_2020_12_09 d
where p.id = d.id and p.version = d.version and p.deleted is null;

insert into virkailija.payments (
  id,
  version,
  version_closed,
  created_at,
  application_id,
  application_version,
  state,
  deleted,
  filename,
  user_name,
  user_oid,
  batch_id,
  payment_sum,
  phase
)
select
  id,
  version + 1 as version,
  null as version_closed,
  now() as created_at,
  application_id,
  application_version,
  state,
  now() as deleted,
  filename,
  'ADMIN' as user_name,
  '-' as user_oid,
  batch_id,
  payment_sum,
  phase
from support.payment_rows_to_delete_2020_12_09;

insert into virkailija.payments (
  id,
  version,
  version_closed,
  created_at,
  application_id,
  application_version,
  state,
  deleted,
  filename,
  user_name,
  user_oid,
  batch_id,
  payment_sum,
  phase
)
select
  id,
  version + 1 as version,
  null as version_closed,
  now() as created_at,
  application_id,
  application_version,
  state,
  null as deleted,
  filename,
  'ADMIN' as user_name,
  '-' as user_oid,
  batch_id,
  payment_sum,
  phase
from support.payment_rows_to_undelete_2020_12_09;
