CREATE TYPE status AS ENUM ('unhandled', 'plausible', 'rejected', 'accepted');
CREATE TABLE arviot (
    id             serial PRIMARY KEY,
    hakemus_id     integer UNIQUE,
    status         status NOT NULL default 'unhandled'
);
