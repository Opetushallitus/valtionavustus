(ns oph.va.virkailija.application-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.virkailija.db :as va-db]
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

(defn get-application-full-evaluation [application-id]
  (convert-to-dash-keys
    (first (exec :virkailija-db
                 virkailija-queries/get-application-full-evaluation
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

(defn find-applications [search-term order]
  (map
    #(assoc (convert-to-dash-keys %)
            :evaluation (get-application-full-evaluation (:id %)))
    (exec :form-db
          (if (.endsWith order "-desc")
            hakija-queries/find-applications
            hakija-queries/find-applications-asc)
          {:search_term
           (str "%" (clojure.string/lower-case search-term) "%")})))


 (defn create-application-token [application-id]
     (:token (va-db/create-application-token application-id)))


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

(defn accepted? [application]
  (true?
    (get
      (first (exec :virkailija-db
                   virkailija-queries/is-application-accepted
                   {:hakemus_id (:id application)}))
      :accepted)))

(defn get-open-applications []
  (map
    convert-to-dash-keys
    (filter
      accepted?
      (exec :form-db
            hakija-queries/list-open-applications
            {}))))
