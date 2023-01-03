CREATE TABLE comments (
    id             serial PRIMARY KEY,
    created_at     timestamp with time zone NOT NULL DEFAULT now(),
    arvio_id       integer NOT NULL,
    first_name     VARCHAR(32) NOT NULL,
    last_name      VARCHAR(32) NOT NULL,
    email          VARCHAR(128) NOT NULL,
    comment        TEXT NOT NULL,
    FOREIGN KEY (arvio_id) REFERENCES arviot (id)
);

CREATE INDEX ON comments (arvio_id);
