CREATE TABLE muutoshakemus (
    id          serial primary key,
    user_key    varchar(64) NOT NULL,

    haen_kayttoajan_pidennysta boolean,
    kayttoajan_pidennys_perustelut text,
    uusi_kayttoajan_paattymispaiva date,

    created_at    timestamp with time zone NOT NULL default now()
    CHECK ( haen_kayttoajan_pidennysta = false OR (kayttoajan_pidennys_perustelut is not null AND uusi_kayttoajan_paattymispaiva is not null) )
);

/* TODO: muutoshakemus must have reference to specific version of hakemus
   FOREIGN KEY (form_submission_id, form_submission_version) REFERENCES hakemukset (id, version)
*/
