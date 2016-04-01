select h.id, h.version, h.organization_name, h.project_name, hd.sent_emails
from hakija.hakemukset h
  left outer join hakija.hakemus_decisions hd on (hd.hakemus_id = h.id and hd.hakemus_version = h.version)
where h.avustushaku = :avustushaku_id
      and h.status = 'submitted'
      and h.version_closed is null
order by upper(h.organization_name)
