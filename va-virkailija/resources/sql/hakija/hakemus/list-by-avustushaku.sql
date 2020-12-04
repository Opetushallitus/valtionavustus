select  h.id,
        h.version, 
        h.created_at,
        h.organization_name,
        h.project_name,
        h.language,
        h.status,
        h.status_change_comment,
        h.budget_total,
        h.budget_oph_share,
        s.answers->'value' as answer_values,
        h.user_key,
        h.register_number,
        h.status_loppuselvitys,
        h.status_valiselvitys,
        (select  
          (CASE
            WHEN paatos_id IS NULL
            THEN 'new'
            ELSE status::text
          END) as status_muutoshakemus
          from  virkailija.muutoshakemus m
          LEFT JOIN virkailija.paatos ON m.paatos_id = virkailija.paatos.id
          where m.hakemus_id = h.id
          order by m.created_at desc limit 1),
        h.refused,
        h.refused_comment,
        h.refused_at,
        submitted_version
  from hakija.hakemukset h
  join hakija.form_submissions s on (h.form_submission_id = s.id and h.form_submission_version = s.version)
where h.avustushaku = :avustushaku_id
      and h.status != 'cancelled'
      and h.status != 'new'
      and h.version_closed is null
      and h.hakemus_type='hakemus'
order by upper(h.organization_name), upper(h.project_name)
