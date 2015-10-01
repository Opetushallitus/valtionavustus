CREATE TABLE attachments (
    id               serial NOT NULL,
    version          integer NOT NULL,

    hakemus_id       integer NOT NULL,
    hakemus_version  integer NOT NULL,

    version_closed   timestamp with time zone default NULL,

    created_at       timestamp with time zone default now(),

    field_id         VARCHAR(128) NOT NULL,
    filename         VARCHAR(128) NOT NULL,
    content_type     VARCHAR(128) NOT NULL,
    file_size        integer NOT NULL,

    file_data        bytea NOT NULL,

    PRIMARY KEY (id, version),
    FOREIGN KEY (hakemus_id, hakemus_version) REFERENCES hakemukset(id, version),
    UNIQUE (hakemus_id, hakemus_version, id, version)
);
