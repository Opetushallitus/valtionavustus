(ns oph.va.virkailija.application-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.virkailija.utils :refer [convert-to-dash-keys]]
            [clj-time.core :as t]
            [clj-time.coerce :as c]
            [oph.va.virkailija.db.queries :as virkailija-queries]
            [oph.va.hakija.api.queries :as hakija-queries])
  (:import (oph.va.jdbc.enums)))

(defn get-application [id]
  (convert-to-dash-keys (first (exec :form-db
                                     hakija-queries/get-application
                                     {:application_id id}))))

(defn find-application-by-register-number [register-number]
  (convert-to-dash-keys
    (first
      (exec :form-db
            hakija-queries/find-application-by-register-number
            {:register_number register-number}))))

(defn get-application-evaluation [application-id]
  (convert-to-dash-keys
    (first (exec :virkailija-db
                 virkailija-queries/get-application-evaluation
                 {:application_id application-id}))))

(defn get-application-with-evaluation-and-answers [id]
  (when-let [application (get-application id)]
    (merge application (get-application-evaluation (:id application)))))

(defn get-applications-with-evaluation-by-grant [grant-id]
  (mapv
    #(merge (convert-to-dash-keys %) (get-application-evaluation (:id %)))
    (exec :form-db hakija-queries/get-applications-by-grant
          {:grant_id grant-id})))

(defn get-payments-history [id]
  (mapv convert-to-dash-keys
        (exec :virkailija-db
              virkailija-queries/get-payment-history
              {:application_id id})))

(defn get-application-payment [id]
  (convert-to-dash-keys (last (exec :virkailija-db
                                    virkailija-queries/get-application-payment
                                    {:application_id id}))))

(defn get-application-payment-by-state [application-id state]
  (convert-to-dash-keys
    (last (exec :virkailija-db
                virkailija-queries/get-application-payment-by-state
                {:application_id application-id
                 :state state}))))

(defn get-application-payments [id]
  (map convert-to-dash-keys (exec :virkailija-db
                                  virkailija-queries/get-application-payments
                                  {:application_id id})))
(defn find-applications [search-term]
  (map convert-to-dash-keys
       (exec :form-db
             hakija-queries/find-applications
             {:search_term (str "%" (clojure.string/lower-case search-term) "%")})))

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

(defn is-unpaid? [application-id]
  (:unpaid
   (first
     (exec :form-db virkailija-queries/is-application-paid
           {:application_id application-id}))))
