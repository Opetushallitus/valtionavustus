select id,
       version,
       avustushaku,
       created_at,
       status,
       organization_name,
       project_name,
       register_number,
       budget_total,
       budget_oph_share
from hakemukset
where organization_name ilike :organization_name
      and version_closed is null
      and status in ('submitted', 'pending_change_request', 'officer_edit')
order by organization_name, project_name
