create table va_users_cache (
  id serial primary key,
  person_oid varchar(64) unique not null,
  first_name varchar(128),
  surname varchar(128),
  email varchar(128),
  content jsonb not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
