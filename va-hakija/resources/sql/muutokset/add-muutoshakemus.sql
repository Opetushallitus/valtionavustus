INSERT INTO muutoshakemus (id, user_key, hakemus_version, haen_kayttoajan_pidennysta, kayttoajan_pidennys_perustelut, haettu_kayttoajan_paattymispaiva )
SELECT nextval('muutoshakemus_id_seq'),
       :user_key,
       :hakemus_version,
       :haen_kayttoajan_pidennysta,
       :kayttoajan_pidennys_perustelut,
       :haettu_kayttoajan_paattymispaiva
