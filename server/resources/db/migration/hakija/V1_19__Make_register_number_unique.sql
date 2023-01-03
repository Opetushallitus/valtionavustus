alter table hakemukset add constraint hakemus_register_number_unique_constraint unique (id, version, register_number)
