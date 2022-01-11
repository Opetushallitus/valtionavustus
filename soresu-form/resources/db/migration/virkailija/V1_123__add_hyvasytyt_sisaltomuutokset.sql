create table paatos_sisaltomuutos (
  paatos_id integer primary key references paatos (id),
  hyvaksytyt_sisaltomuutokset text not null
);