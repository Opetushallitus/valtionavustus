DROP TABLE muutoshakemus;

CREATE TABLE muutoshakemus (
    id              serial primary key,
    hakemus_id      integer UNIQUE NOT NULL,

    haen_kayttoajan_pidennysta          boolean,
    kayttoajan_pidennys_perustelut      text,
    haettu_kayttoajan_paattymispaiva    date,

    created_at      timestamp with time zone NOT NULL default now(),
    CHECK ( haen_kayttoajan_pidennysta = false OR (kayttoajan_pidennys_perustelut is not null AND haettu_kayttoajan_paattymispaiva is not null) )
);
