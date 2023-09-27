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
        h.loppuselvitys_information_verified_by,
        h.loppuselvitys_information_verified_at,
        h.loppuselvitys_information_verification,
        h.loppuselvitys_taloustarkastettu_at,
        h.loppuselvitys_taloustarkastanut_name,
        (select
          (CASE
            WHEN m.paatos_id IS NULL
            THEN 'new'
            ELSE
              -- Tää toimii ns. oikein eli wanhalla tavalla kun kaikille osioille on
              -- annettu sama hyväksytty/hylätty päätös
              coalesce(pj.status, pt.status, ps.status)::text
          END) as status_muutoshakemus
          from  virkailija.muutoshakemus m
          LEFT JOIN virkailija.paatos ON m.paatos_id = virkailija.paatos.id
          LEFT JOIN virkailija.paatos_jatkoaika pj ON pj.paatos_id = paatos.id
          LEFT JOIN virkailija.paatos_talousarvio pt ON pt.paatos_id = paatos.id
          LEFT JOIN virkailija.paatos_sisaltomuutos ps ON ps.paatos_id = paatos.id
          where m.hakemus_id = h.id
          order by m.created_at desc limit 1),
        h.refused,
        h.refused_comment,
        h.refused_at,
        h.keskeytetty_aloittamatta,
        (SELECT count(*) > 0
              FROM hakija.hakemukset
              WHERE parent_id = h.id
              AND hakemus_type='loppuselvitys'
              AND status = 'pending_change_request'
              AND version_closed IS null) AS loppuselvitys_change_request_pending,
        (SELECT count(id) > 0
              FROM hakija.hakemukset
              WHERE status = 'pending_change_request'
              AND hakemus_type='loppuselvitys'
              AND parent_id = h.id) AS loppuselvitys_change_request_sent,
        submitted_version
  from hakija.hakemukset h
  join hakija.form_submissions s on (h.form_submission_id = s.id and h.form_submission_version = s.version)
where h.avustushaku = :avustushaku_id
      and h.status != 'cancelled'
      and h.status != 'new'
      and h.version_closed is null
      and h.hakemus_type='hakemus'
order by upper(h.organization_name), upper(h.project_name)
