select h.id, h.user_key
from hakija.hakemukset h
where h.avustushaku = :avustushaku_id
      and h.status != 'cancelled'
      and h.status != 'draft'
      and h.status_valiselvitys = 'missing'
      and h.status != 'new'
      and h.version_closed is null
      and h.hakemus_type='hakemus';