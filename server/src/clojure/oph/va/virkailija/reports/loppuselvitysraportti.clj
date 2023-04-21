(ns oph.va.virkailija.reports.loppuselvitysraportti
  (:require [dk.ative.docjure.spreadsheet :as spreadsheet]
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

(defn export-loppuselvitysraportti []
  (let [asiatarkastettu-rows (get-loppuselvitys-tarkastetut-rows)
        asiatarkastamatta-rows (get-loppuselvitys-asiatarkastamatta-rows)
        output (ByteArrayOutputStream.)
        wb (spreadsheet/create-workbook
            "Loppuselvitysraportti"
            (concat
             [["Vuosi" "Vastaanotettu" "Asiatarkastettu" "Taloustarkastettu"]]
             (make-loppuselvitysraportti-rows asiatarkastettu-rows))
            "Asiatarkastamattomat"
            (concat
             [["Avustushaku", "Lukumäärä", "Valmistelija"]]
             (make-loppuselvitysraportti-rows asiatarkastamatta-rows)))]
    (.write wb output)
    (.toByteArray output)))
