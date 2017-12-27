(ns oph.va.virkailija.grant-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.virkailija.db.queries :as virkailija-queries]
            [oph.va.virkailija.utils :refer [convert-to-dash-keys]]))

(defn get-grants []
  (mapv convert-to-dash-keys
        (exec :form-db virkailija-queries/get-grants {})))

(defn get-resolved-grants-with-content []
  (mapv convert-to-dash-keys
        (exec :form-db virkailija-queries/get-resolved-grants-with-content {})))

(defn get-grant [grant-id]
  (convert-to-dash-keys
   (first (exec :form-db virkailija-queries/get-grant {:grant_id grant-id}))))

(defn get-grant-applications-with-evaluation [grant-id]
  (mapv convert-to-dash-keys
        (exec :form-db virkailija-queries/get-grant-applications-with-evaluation
              {:grant_id grant-id})))

(defn get-grant-applications [grant-id]
  (mapv convert-to-dash-keys
        (exec :form-db virkailija-queries/get-grant-applications
              {:grant_id grant-id})))

(defn get-grant-payments [id]
  (mapv convert-to-dash-keys
        (exec :form-db virkailija-queries/get-grant-payments {:id id})))

(defn delete-grant-payments [id]
  (exec :form-db virkailija-queries/delete-grant-payments {:id id}))

(defn get-grant-roles [id]
  (mapv convert-to-dash-keys
        (exec :form-db virkailija-queries/get-grant-roles {:id id})))
