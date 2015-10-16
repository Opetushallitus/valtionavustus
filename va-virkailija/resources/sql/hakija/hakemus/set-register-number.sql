update hakemukset set register_number = :register_number where id = :hakemus_id and version_closed is null;
