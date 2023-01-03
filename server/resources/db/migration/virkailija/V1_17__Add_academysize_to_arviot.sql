alter table arviot add academysize integer not null default 0;
comment on column arviot.academysize is 'Oppilaitoksen koko';