(ns oph.va.virkailija.application-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.virkailija.utils :refer [convert-to-dash-keys]]
            [clj-time.core :as t]
            [clj-time.coerce :as c]
            [oph.va.virkailija.grant-data :as grant-data]
            [oph.va.virkailija.db.queries :as virkailija-queries])
  (:import (oph.va.jdbc.enums)))

(defn get-application [id]
  (convert-to-dash-keys (first (exec :form-db
                                     virkailija-queries/get-application
                                     {:application_id id}))))

(defn get-application-with-evaluation-and-answers [id]
  (convert-to-dash-keys
    (first (exec :form-db
                 virkailija-queries/get-application-with-evaluation-and-answers
                 {:application_id id}))))

(defn get-payments-history [id]
  (mapv convert-to-dash-keys
    (exec :form-db
          virkailija-queries/get-payment-history
          {:application_id id})))

(defn get-application-payment [id]
  (convert-to-dash-keys (last (exec :form-db
                                    virkailija-queries/get-application-payment
                                    {:application_id id}))))

(defn get-application-payment-by-state [application-id state]
  (convert-to-dash-keys
    (last (exec :form-db
                virkailija-queries/get-application-payment-by-state
                {:application_id application-id
                 :state state}))))

(defn get-application-payments [id]
  (map convert-to-dash-keys (exec :form-db
                                  virkailija-queries/get-application-payments
                                  {:application_id id})))
(defn find-applications [search-term]
  (map convert-to-dash-keys
       (exec :form-db
             virkailija-queries/find-applications
             {:search_term (str "%" (clojure.string/lower-case search-term) "%")})))
