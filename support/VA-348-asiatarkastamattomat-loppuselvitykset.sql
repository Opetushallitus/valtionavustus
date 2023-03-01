select
  hakemus.avustushaku as avustushaku_id,
  count(*) as Asiatarkastamattomia,
  coalesce(rooli.email, 'Ei valmistelijaa') as valmistelija
from hakija.hakemukset as hakemus
       left join virkailija.arviot arvio on arvio.hakemus_id = hakemus.id
       left join hakija.avustushaku_roles rooli on rooli.id = arvio.presenter_role_id
where hakemus.loppuselvitys_information_verified_at is null
  and hakemus.version_closed is null
  and hakemus.status_loppuselvitys = 'submitted'

group by avustushaku_id, valmistelija
order by avustushaku_id;
