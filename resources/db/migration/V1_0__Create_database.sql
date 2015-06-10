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

CREATE TYPE status AS ENUM ('initial', 'draft', 'submitted');
CREATE TABLE hakemukset (
    id              serial PRIMARY KEY,
    user_key        varchar(64) UNIQUE NOT NULL,
    form_submission integer references form_submissions(id) NOT NULL,
    submittime      timestamp with time zone default now(),
    status          status NOT NULL
);

CREATE TABLE avustushaut (
    id             serial PRIMARY KEY,
    submittime     timestamp with time zone default now(),
    form           integer references forms(id) NOT NULL,
    content        jsonb NOT NULL
);
