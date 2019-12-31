SELECT hakemukset.id
FROM hakija.hakemukset
LEFT JOIN virkailija.arviot ON (hakemukset.id = arviot.hakemus_id)
WHERE hakemukset.id IN (:hakemus_ids)
AND hakemukset.version_closed IS NULL
AND arviot.presenter_role_id IS NULL
