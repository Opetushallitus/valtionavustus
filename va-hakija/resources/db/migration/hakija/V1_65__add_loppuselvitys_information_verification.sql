ALTER TABLE hakija.hakemukset
ADD COLUMN loppuselvitys_information_verified_by text DEFAULT NULL,
ADD COLUMN loppuselvitys_information_verified_at timestamp with time zone DEFAULT null;
