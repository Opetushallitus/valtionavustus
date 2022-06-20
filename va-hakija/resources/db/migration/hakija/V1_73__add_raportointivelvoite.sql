create table raportointivelvoite (
  id              serial primary key,
  avustushaku_id  integer not null,
  raportointilaji text not null,
  maaraaika       date not null,
  asha_tunnus     text not null,
  lisatiedot      text,
  foreign key (avustushaku_id) references hakija.avustushaut (id)
)
