UPDATE register_number_sequences SET suffix = '1778/2022' where suffix = '1778/2002';

update hakemukset set register_number = replace(register_number, '2002', '2022') where avustushaku = 391;

update normalized_hakemus set register_number = replace(normalized_hakemus.register_number, '2002', '2022') from hakemukset where hakemus_id = hakemukset.id and avustushaku = 391;
