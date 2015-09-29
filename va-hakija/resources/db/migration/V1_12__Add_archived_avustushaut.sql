CREATE TABLE archived_avustushaut (
    avustushaku_id integer NOT NULL,
    form_id        integer references forms(id) NOT NULL,
    created_at     timestamp with time zone NOT NULL,
    status         haku_status NOT NULL,
    content        jsonb NOT NULL,
    archived_at    timestamp with time zone default now(),
    PRIMARY KEY (avustushaku_id, archived_at)
);
COMMENT ON TABLE archived_forms IS 'Old versions of avustushaut.';
