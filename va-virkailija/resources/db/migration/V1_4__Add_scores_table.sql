create table scores (
    arvio_id       integer not null,
    person_oid     varchar(64) not null,
    selection_criteria_index integer not null,
    score          integer not null,
    created_at     timestamp with time zone not null default now(),
    modified_at    timestamp with time zone not null default now(),
    primary key (arvio_id, person_oid, selection_criteria_index),
    foreign key (arvio_id) references arviot (id)
);

create index on scores (arvio_id);
