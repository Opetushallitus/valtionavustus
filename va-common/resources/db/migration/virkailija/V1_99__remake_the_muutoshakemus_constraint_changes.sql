alter table muutoshakemus
drop constraint muutoshakemus_hakemus_id_key,
add constraint unique_new_muutoshakemus exclude (hakemus_id with =) where (paatos_id is null);
