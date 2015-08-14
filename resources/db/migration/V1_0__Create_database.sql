CREATE TABLE forms (
    id             serial PRIMARY KEY,
    created_at     timestamp with time zone default now(),
    content        jsonb NOT NULL
);

CREATE TABLE form_submissions (
    id               integer NOT NULL,
    created_at       timestamp with time zone default now(),
    form             integer references forms(id) NOT NULL,
    version          integer NOT NULL,
    version_closed   timestamp with time zone default NULL,
    answers          jsonb NOT NULL,
    PRIMARY KEY (id, version)
);
CREATE SEQUENCE form_submissions_id_seq;
CREATE INDEX ON form_submissions (form);

CREATE TYPE status AS ENUM ('draft', 'submitted', 'cancelled');
CREATE TABLE hakemukset (
    id                      serial PRIMARY KEY,
    user_key                varchar(64) UNIQUE NOT NULL,
    form_submission_id      integer NOT NULL,
    form_submission_version integer NOT NULL,
    created_at              timestamp with time zone default now(),
    verified_at             timestamp with time zone,
    submitted_at            timestamp with time zone,
    cancelled_at            timestamp with time zone,
    status                  status NOT NULL default 'draft',
    FOREIGN KEY (form_submission_id, form_submission_version) REFERENCES form_submissions (id, version)
);
CREATE INDEX ON hakemukset (form_submission_id);

CREATE TABLE avustushaut (
    id             serial PRIMARY KEY,
    created_at     timestamp with time zone default now(),
    form           integer references forms(id) NOT NULL,
    content        jsonb NOT NULL
);
