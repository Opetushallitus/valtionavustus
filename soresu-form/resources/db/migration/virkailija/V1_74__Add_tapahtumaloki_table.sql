CREATE TABLE tapahtumaloki (
    id              serial PRIMARY KEY,
    tyyppi          VARCHAR(32) NOT NULL,
    created_at      timestamp with time zone NOT NULL DEFAULT now(),
    avustushaku_id  integer NOT NULL,
    user_name       varchar(128) NOT NULL,
    user_oid        varchar(64) NOT NULL,

    FOREIGN KEY (avustushaku_id) REFERENCES hakija.avustushaut (id)
);
