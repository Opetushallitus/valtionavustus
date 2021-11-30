ALTER TABLE hakija.hakemukset
ADD COLUMN loppuselvitys_taloustarkastanut_oid text DEFAULT NULL,
ADD COLUMN loppuselvitys_taloustarkastanut_name text DEFAULT NULL,
ADD COLUMN loppuselvitys_taloustarkastettu_at timestamp with time zone DEFAULT null;
