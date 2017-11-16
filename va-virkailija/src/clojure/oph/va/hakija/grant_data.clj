(ns oph.va.hakija.grant-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.va.hakija.api :refer [convert-to-dash-keys]]))

(defn get-grants []
  (mapv convert-to-dash-keys
        (exec :form-db hakija-queries/get-grants {})))

(defn get-grants-with-content []
  (mapv convert-to-dash-keys
        (exec :form-db hakija-queries/get-grants-with-content {})))

(defn get-grant [grant-id]
  (convert-to-dash-keys
   (first (exec :form-db hakija-queries/get-grant {:grant_id grant-id}))))

(defn get-grant-evaluations [grant-id]
  (mapv convert-to-dash-keys
        (exec :form-db hakija-queries/list-hakemus-paatos-email-statuses
              {:avustushaku_id grant-id})))

(defn get-grant-applications-with-evaluation [grant-id]
  (mapv convert-to-dash-keys
        (exec :form-db hakija-queries/get-grant-applications-with-evaluation
              {:grant_id grant-id})))

(defn get-grant-applications [grant-id]
  (mapv convert-to-dash-keys
        (exec :form-db hakija-queries/get-grant-applications
              {:grant_id grant-id})))
