alter table arviot add column oppilaitokset jsonb not NULL default '{"names": []}';
comment on column arviot.oppilaitokset is 'JSON object containing oppilaitokset names as array field';
