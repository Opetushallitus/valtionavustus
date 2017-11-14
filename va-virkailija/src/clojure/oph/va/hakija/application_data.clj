(ns oph.va.hakija.application-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.va.hakija.api :refer [convert-to-dash-keys]]
            [oph.va.hakija.grant-data :as grant-data]))

(defn get-application [id]
  (convert-to-dash-keys
   (first
    (exec :form-db hakija-queries/get-application {:application_id id}))))

(defn create-payment [application-id]
  {})
