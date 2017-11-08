(ns oph.va.hakija.grant-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.va.hakija.api :refer [convert-to-dash-keys]]))

(defn get-grants [props]
  (mapv convert-to-dash-keys
        (exec :form-db (if (:include-content props)
                         hakija-queries/get-grants-with-content
                         hakija-queries/get-grants) {})))

(defn get-grant [grant-id]
  (convert-to-dash-keys
   (first (exec :form-db hakija-queries/get-grant {:grant_id grant-id}))))
