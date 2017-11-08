(ns oph.va.hakija.grant-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.va.hakija.api :refer [convert-to-dash-keys]]))

(defn get-grants []
  (mapv convert-to-dash-keys (exec :form-db hakija-queries/get-grants {})))

(defn get-grant [grant-id]
  (convert-to-dash-keys
   (first (exec :form-db hakija-queries/get-grant {:grant_id grant-id}))))
