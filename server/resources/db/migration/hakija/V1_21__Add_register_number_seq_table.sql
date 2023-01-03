create table register_number_sequences(
  suffix     varchar(32) primary key not null,
  seq_number integer not null default 1
);
