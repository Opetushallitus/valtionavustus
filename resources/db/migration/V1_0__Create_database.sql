CREATE TABLE forms (
    id             serial PRIMARY KEY,
    start          timestamp with time zone default (now() at time zone 'utc'),
    metadata       jsonb NOT NULL
);

CREATE TABLE form_submissions (
    id             serial PRIMARY KEY,
    submittime     timestamp with time zone default (now() at time zone 'utc'),
    form           integer references forms(id) NOT NULL,
    answers        jsonb NOT NULL
);
