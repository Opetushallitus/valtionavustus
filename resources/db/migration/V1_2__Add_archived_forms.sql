CREATE TABLE archived_forms (
    form_id        integer NOT NULL,
    created_at     timestamp with time zone NOT NULL,
    content        jsonb NOT NULL,
    archived_at    timestamp with time zone default now(),
    PRIMARY KEY (form_id, archived_at)
);
COMMENT ON TABLE archived_forms IS 'Forms that have been in use but that have needed modifications while already published.';
