(ns oph.va.virkailija.external-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.virkailija.utils :refer [convert-to-dash-keys]]
            [oph.va.virkailija.db.external-queries :as external-queries]))

(defn get-grants-for-year [year]
  (let [rows (exec :virkailija-db external-queries/get-grants-for-year {:year year})]
    (map convert-to-dash-keys rows)))
