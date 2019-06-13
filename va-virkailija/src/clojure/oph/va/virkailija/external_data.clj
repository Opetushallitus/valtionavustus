(ns oph.va.virkailija.external-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.virkailija.utils :refer [convert-to-dash-keys]]
            [oph.va.virkailija.db.external-queries :as external-queries]))

(defn get-grants-for-year [year]
  (let [rows (exec :virkailija-db external-queries/get-grants-for-year {:year year})]
    (map convert-to-dash-keys rows)))

(defn get-applications-by-grant-id [grant-id]
  (let [rows (exec :virkailija-db external-queries/get-applications-by-grant-id {:grant_id grant-id})]
    (map convert-to-dash-keys rows)))
