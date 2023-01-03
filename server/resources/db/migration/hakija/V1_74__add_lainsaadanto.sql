create table lainsaadanto (
  id    serial primary key,
  name  text
);

create table avustushaku_lainsaadanto (
  avustushaku_id  integer not null,
  lainsaadanto_id integer not null,
  primary key (avustushaku_id, lainsaadanto_id),
  foreign key (avustushaku_id) references hakija.avustushaut (id),
  foreign key (lainsaadanto_id) references hakija.lainsaadanto (id)
);

insert into lainsaadanto (name) values
  ('Valtionavustuslaki'),
  ('Laki opetus- ja kulttuuritoimen rahoituksesta'),
  ('Laki vapaasta sivistystyöstä');
