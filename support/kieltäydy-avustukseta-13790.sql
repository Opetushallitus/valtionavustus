insert into hakemukset (id, avustushaku, user_key, version, form_submission_id,
   form_submission_version, user_oid, user_first_name, user_last_name,
   user_email, budget_total, budget_oph_share, organization_name,
   project_name, language, status, register_number, last_status_change_at,
   status_change_comment, hakemus_type, parent_id, status_valiselvitys,
   status_loppuselvitys, refused, refused_comment, refused_at,
   submitted_version)
select id, avustushaku, user_key, version + 1, form_submission_id,
  form_submission_version, user_oid, user_first_name, user_last_name,
  user_email, budget_total, budget_oph_share, organization_name,
  project_name, language, status, register_number, last_status_change_at,
  status_change_comment, hakemus_type, parent_id, status_valiselvitys,
  status_loppuselvitys, true, 'Asetettu kieltäydyttyyn tilaan manuaalisesti (OPHY-492)', now(), submitted_version
from hakemukset
where id = 13790
and version = 223
and version_closed is null;

update hakemukset
set version_closed = now()
where id = 13790
and version = 223
and version_closed is null;
