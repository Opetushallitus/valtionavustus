CREATE TABLE cards (
    id             serial PRIMARY KEY,
    start          date,
    finish         date,
    metadata       jsonb
);

