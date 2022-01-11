select hakemukset.avustushaku, rahoitusalue
from virkailija.arviot join hakija.hakemukset on hakemukset.id = arviot.hakemus_id
where arviot.rahoitusalue is not null and hakemukset.version_closed is null
group by arviot.rahoitusalue, hakemukset.avustushaku order by avustushaku;