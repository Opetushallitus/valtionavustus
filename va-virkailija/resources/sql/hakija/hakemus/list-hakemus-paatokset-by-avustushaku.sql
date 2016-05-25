select h.id, h.version, h.organization_name, h.project_name,h.user_key, hd.sent_emails, hd.sent_time, count(hpv.view_time) as view_count
from hakija.hakemukset h
  left outer join hakija.hakemus_paatokset hd on (hd.hakemus_id = h.id)
  left outer join hakija.hakemus_paatokset_views hpv on (hpv.hakemus_id=h.id)
where h.avustushaku = :avustushaku_id
      and h.status = 'submitted'
      and h.version_closed is null
group by h.id, h.version, h.organization_name, h.project_name, hd.sent_emails, hd.sent_time
order by hd.sent_time desc
