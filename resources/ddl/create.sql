CREATE TABLE forms (
    id             serial PRIMARY KEY,
    start          date,
    finish         date,
    metadata       jsonb
);

