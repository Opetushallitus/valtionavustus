(ns oph.va.virkailija.application-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.virkailija.utils :refer [convert-to-dash-keys]]
            [clj-time.core :as t]
            [oph.va.virkailija.db.queries :as virkailija-queries]
            [oph.va.hakija.api.queries :as hakija-queries])
  (:import (oph.va.jdbc.enums)))

(defn get-application-evaluation [application-id]
  (convert-to-dash-keys
    (first (exec :virkailija-db
                 virkailija-queries/get-application-evaluation
                 {:application_id application-id}))))

(defn get-application [id]
  (convert-to-dash-keys
    (merge
      (first (exec :form-db
                   hakija-queries/get-application
                   {:application_id id}))
      (get-application-evaluation id))))

(defn find-application-by-register-number [register-number]
  (convert-to-dash-keys
   (first
    (exec :form-db
          hakija-queries/find-application-by-register-number
          {:register_number register-number}))))

(defn get-applications-with-evaluation-by-grant [grant-id]
  (mapv
   #(merge (convert-to-dash-keys %) (get-application-evaluation (:id %)))
   (exec :form-db hakija-queries/get-applications-by-grant
         {:grant_id grant-id})))

(defn get-application-unsent-payments [application-id]
  (map
   convert-to-dash-keys
   (exec :virkailija-db
         virkailija-queries/get-application-unsent-payments
         {:application_id application-id})))

(defn get-application-payments [id]
  (map convert-to-dash-keys (exec :virkailija-db
                                  virkailija-queries/get-application-payments
                                  {:application_id id})))

(defn find-applications [search-term]
  (map convert-to-dash-keys
       (exec :form-db
             hakija-queries/find-applications
             {:search_term
              (str "%" (clojure.string/lower-case search-term) "%")})))



(defn get-application-token [application-id]
  (:token
   (first
    (exec :form-db
          hakija-queries/get-application-token
          {:application_id application-id}))))

(defn revoke-application-tokens [application-id]
  (exec :form-db
        hakija-queries/revoke-application-tokens
        {:application_id application-id}))

(defn has-no-payments? [application-id]
  (not
   (:has_payments
    (first
     (exec :virkailija-db virkailija-queries/application-has-payments
           {:application_id application-id})))))
