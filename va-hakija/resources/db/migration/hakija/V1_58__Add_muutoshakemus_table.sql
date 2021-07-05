CREATE TABLE muutoshakemus (
    id              serial primary key,
    user_key        varchar(64) NOT NULL,
    hakemus_version integer NOT NULL,

    haen_kayttoajan_pidennysta          boolean,
    kayttoajan_pidennys_perustelut      text,
    haettu_kayttoajan_paattymispaiva    date,

    created_at      timestamp with time zone NOT NULL default now(),
    FOREIGN KEY (user_key, hakemus_version) REFERENCES hakemukset (user_key, version),
    CHECK ( haen_kayttoajan_pidennysta = false OR (kayttoajan_pidennys_perustelut is not null AND haettu_kayttoajan_paattymispaiva is not null) )
);
