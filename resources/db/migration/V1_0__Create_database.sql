CREATE TABLE forms (
    id             serial PRIMARY KEY,
    start          timestamp with time zone default now(),
    content        jsonb NOT NULL
);

CREATE TABLE form_submissions (
    id             serial PRIMARY KEY,
    submittime     timestamp with time zone default now(),
    form           integer references forms(id) NOT NULL,
    answers        jsonb NOT NULL
);
