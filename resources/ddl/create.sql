CREATE TABLE forms (
    id             serial PRIMARY KEY,
    start          timestamp with time zone default (now() at time zone 'utc'),
    metadata       jsonb
);

