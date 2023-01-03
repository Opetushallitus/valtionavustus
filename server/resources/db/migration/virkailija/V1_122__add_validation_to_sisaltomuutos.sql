UPDATE muutoshakemus SET haen_sisaltomuutosta = false WHERE haen_sisaltomuutosta IS NULL;
ALTER TABLE muutoshakemus ALTER COLUMN haen_sisaltomuutosta SET NOT NULL;
ALTER TABLE muutoshakemus ADD CONSTRAINT muutoshakemus_sisaltomuutos_check
	CHECK (haen_sisaltomuutosta = false OR sisaltomuutos_perustelut is not null);

/* originally created in V1_58__Add_muutoshakemus_table without a name */
ALTER TABLE muutoshakemus RENAME CONSTRAINT muutoshakemus_check TO muutoshakemus_kayttoajan_pidennys_check;

ALTER TABLE muutoshakemus ALTER COLUMN haen_kayttoajan_pidennysta SET NOT NULL;