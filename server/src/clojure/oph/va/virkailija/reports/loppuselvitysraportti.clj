(ns oph.va.virkailija.reports.loppuselvitysraportti
  (:require [dk.ative.docjure.spreadsheet :as spreadsheet]
            [oph.soresu.form.formhandler :as formhandler]
            [oph.soresu.common.db :refer [query]])
  (:import (java.io ByteArrayOutputStream)))

(defn- get-loppuselvitys-asiatarkastamatta-rows []
  (query "
    select hakemus.avustushaku as avustushaku_id,
    count(*) as lukumäärä,
    coalesce(rooli.email, 'Ei valmistelijaa') as valmistelija
    from hakija.hakemukset as hakemus
    left join virkailija.arviot arvio on arvio.hakemus_id = hakemus.id
    left join hakija.avustushaku_roles rooli on rooli.id = arvio.presenter_role_id
    where hakemus.loppuselvitys_information_verified_at is null and
          hakemus.status_loppuselvitys = 'submitted' and
          hakemus.version_closed is null
    group by avustushaku_id, valmistelija
    order by avustushaku_id
    " []))

(defn- get-loppuselvitys-tarkastetut-rows []
  (query "
  with loppuselvitykset as (
    select date_part('year', h.last_status_change_at) as year, count(*) as count
    from hakija.hakemukset h
    where hakemus_type = 'loppuselvitys' and
          status = 'submitted'
    group by year
    order by year desc
), asiatarkastetut_loppuselvitykset as (
    select date_part('year', h.loppuselvitys_information_verified_at) as year, count(*) as count
    from hakija.hakemukset h
    where h.version_closed is null and
          h.loppuselvitys_information_verified_at is not null
    group by year
    order by year desc
), taloustarkastetut_loppuselvitykset as (
    select date_part('year', h.loppuselvitys_taloustarkastettu_at) as year, count(*) as count
    from hakija.hakemukset h
    where h.version_closed is null and
          h.loppuselvitys_taloustarkastettu_at is not null
    group by year
    order by year desc
)
select
    l.year,
    l.count as loppuselvitykset_count,
    coalesce(al.count, 0) asiatarkastetut_count,
    coalesce(tl.count, 0) taloustarkastetut_count
from loppuselvitykset l
left join asiatarkastetut_loppuselvitykset al on al.year = l.year
left join taloustarkastetut_loppuselvitykset tl on tl.year = l.year
 " {}))

(defn- make-loppuselvitysraportti-rows [rows]
  (mapv vals rows))

(defn- get-hakemukset-rows []
  (query
   "
    with ha as (
      select h.register_number as register_number,
            a.content->'name'->'fi' as avustushaun_nimi,
            h.organization_name as organization_name,
            va.budget_granted as budget_granted,
            form_submission_id,
            form_submission_version
      from hakija.hakemukset h
              join virkailija.arviot va on va.hakemus_id = h.id
              join hakija.avustushaut a on h.avustushaku = a.id
      where version_closed is null
        and h.status in ('submitted', 'pending_change_request', 'officer_edit')
     ),
     a as (
         SELECT id, version, elem->>'key' as key, elem->>'value' as value
         FROM ha
         JOIN hakija.form_submissions fs
           ON fs.id = ha.form_submission_id AND fs.version = ha.form_submission_version
            AND fs.version_closed is null
         CROSS JOIN jsonb_path_query(fs.answers, '$.value[*] ? (@.key == "business-id" || @.key == "radioButton-0")') as elem
     ),
     b as (
         SELECT id, version, value as business_id
         FROM a
         WHERE key = 'business-id'
     ),
     o as (
         SELECT id, version, value as owner_type
         FROM a
         WHERE key = 'radioButton-0'
     )
select register_number, avustushaun_nimi, organization_name, business_id, owner_type, budget_granted
FROM ha
    LEFT JOIN b ON b.id = ha.form_submission_id AND  b.version = ha.form_submission_version
    LEFT JOIN o ON o.id = b.id AND o.version = b.version
    " {}))

(defn export-loppuselvitysraportti []
  (let [asiatarkastettu-rows (get-loppuselvitys-tarkastetut-rows)
        asiatarkastamatta-rows (get-loppuselvitys-asiatarkastamatta-rows)
        hakemukset-rows (get-hakemukset-rows)
        output (ByteArrayOutputStream.)
        wb (spreadsheet/create-workbook
            "Loppuselvitysraportti"
            (concat
             [["Vuosi" "Vastaanotettu" "Asiatarkastettu" "Taloustarkastettu"]]
             (make-loppuselvitysraportti-rows asiatarkastettu-rows))
            "Asiatarkastamattomat"
            (concat
             [["Avustushaku" "Lukumäärä" "Valmistelija"]]
             (make-loppuselvitysraportti-rows asiatarkastamatta-rows))
            "Hakemukset"
            (concat
             [["Hakemuksen asiatunnus" "Avustushaun nimi" "Hakijaorganisaatio" "Y-tunnus" "Omistajatyyppi" "Myönnetty avustus"]]
             (make-loppuselvitysraportti-rows hakemukset-rows)))]
    (.write wb output)
    (.toByteArray output)))
