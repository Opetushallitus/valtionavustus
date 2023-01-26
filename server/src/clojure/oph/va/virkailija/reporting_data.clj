(ns oph.va.virkailija.reporting-data
  (:require
   [oph.soresu.common.db :refer [exec query]]
   [oph.va.virkailija.db.queries :as queries]
   [oph.va.hakija.api.queries :as hakija-queries]
   [oph.va.virkailija.utils :refer [convert-to-dash-keys]]))

(defn year-to-int-all-v [c]
  (mapv #(update % :year int)
        (filter #(some? (get % :year)) c)))

(defn get-yearly-application-info []
  (mapv convert-to-dash-keys
        (year-to-int-all-v
          (exec hakija-queries/get-yearly-application-info {}))))

(defn get-yearly-application-count []
  (mapv convert-to-dash-keys
        (year-to-int-all-v
          (exec hakija-queries/get-yearly-application-count {}))))

(defn get-accepted-count-by-year []
  (year-to-int-all-v
    (exec queries/get-yearly-evaluation-count-by-status
          {:status "accepted"})))

(defn get-rejected-count-by-year []
  (year-to-int-all-v
    (exec queries/get-yearly-evaluation-count-by-status
          {:status "rejected"})))

(defn get-yearly-total-grant-size []
  (->> (exec hakija-queries/get-yearly-total-grant-size {})
       year-to-int-all-v
       (map convert-to-dash-keys)))

(defn get-yearly-granted []
  (let [grant-sizes (reduce #(assoc %1 (:year %2) (:total-grant-size %2))
                            {}
                            (get-yearly-total-grant-size))]
    (mapv
      #(assoc (convert-to-dash-keys %)
              :total-grant-size (get grant-sizes (:year %)))
         (year-to-int-all-v
           (exec queries/get-yearly-granted {})))))

(defn get-total-grant-count []
  (first (exec hakija-queries/get-total-grant-count {})))

(defn get-yearly-resolved-count []
  (mapv convert-to-dash-keys
        (year-to-int-all-v
          (exec hakija-queries/get-yearly-resolved-grants {}))))

(defn get-yearly-education-levels []
  (->> (exec queries/get-yearly-education-level {})
      year-to-int-all-v
      (map convert-to-dash-keys)
      (group-by :year)))

(defn get-yearly-report []
  {:applications (get-yearly-application-info)
   :granted (get-yearly-granted)
   :total-grant-count (:count (get-total-grant-count))})


(defn get-loppuselvitykset-yearly []
  (query "select date_part('year', h.last_status_change_at) as year, count(*) as count
        from hakija.hakemukset h
        where hakemus_type = 'loppuselvitys'
        and status = 'submitted'
        group by year
        order by year desc" {}))

(defn asiatarkastetut-rows []
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
