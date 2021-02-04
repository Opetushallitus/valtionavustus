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

CREATE TYPE status AS ENUM ('new', 'draft', 'submitted', 'cancelled');
CREATE TABLE hakemukset (
    id                      integer NOT NULL,
    user_key                varchar(64) NOT NULL,
    created_at              timestamp with time zone default now(),
    version                 integer NOT NULL,
    version_closed          timestamp with time zone default NULL,
    form_submission_id      integer NOT NULL,
    form_submission_version integer NOT NULL,
    status                  status NOT NULL default 'new',
    last_status_change_at   timestamp with time zone NOT NULL,
    PRIMARY KEY (id, version),
    UNIQUE (user_key, version),
    FOREIGN KEY (form_submission_id, form_submission_version) REFERENCES form_submissions (id, version)
);
CREATE SEQUENCE hakemukset_id_seq;
CREATE INDEX ON hakemukset (form_submission_id);

CREATE TABLE avustushaut (
    id             serial PRIMARY KEY,
    created_at     timestamp with time zone default now(),
    form           integer references forms(id) NOT NULL,
    content        jsonb NOT NULL
);
