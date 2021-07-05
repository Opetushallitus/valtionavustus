CREATE TABLE muutoshakemus (
    id              serial primary key,
    user_key        varchar(64) NOT NULL,
    hakemus_version integer NOT NULL,

    haen_kayttoajan_pidennysta          boolean,
    kayttoajan_pidennys_perustelut      text,
    haettu_kayttoajan_paattymispaiva    date,

    created_at      timestamp with time zone NOT NULL default now(),
    FOREIGN KEY (user_key, hakemus_version) REFERENCES hakemukset (user_key, version),
    /* This check is not named here so it was created as muutoshakemus_check, 
       it is renamed to muutoshakemus_kayttoajan_pidennys_check in 
       migration V1_122__add_validation_to_sisaltomuutos */
    CHECK ( haen_kayttoajan_pidennysta = false OR (kayttoajan_pidennys_perustelut is not null AND haettu_kayttoajan_paattymispaiva is not null) )
);
