CREATE TABLE avustushaku_hakemukset (
  user_key varchar(64) primary key,

  project_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL
);
