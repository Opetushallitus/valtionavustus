(ns oph.va.virkailija.grant-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.virkailija.db.queries :as virkailija-queries]
            [oph.va.virkailija.utils :refer [convert-to-dash-keys]]
            [oph.va.virkailija.lkp-templates :as lkp]
            [oph.va.virkailija.va-code-values-data :as va-code-values]
            [oph.va.virkailija.application-data :as application-data]))

(defn get-grants
  ([content?]
   (let [va-code-values (va-code-values/get-va-code-values)]
     (mapv #(va-code-values/find-grant-code-values
              (convert-to-dash-keys %) va-code-values)
           (exec (if content?
                   virkailija-queries/get-resolved-grants-with-content
                   virkailija-queries/get-grants) {}))))
  ([] (get-grants false)))

(defn get-resolved-grants-with-content []
  (get-grants true))

(defn find-grants [search-term order]
  (mapv convert-to-dash-keys
        (exec (if (.endsWith order "desc")
                virkailija-queries/find-grants
                virkailija-queries/find-grants-asc)
              {:search_term
               (str "%" (clojure.string/lower-case search-term) "%")})))

(defn get-grant [grant-id]
  (let [grant (convert-to-dash-keys
                (first (exec virkailija-queries/get-grant
                             {:grant_id grant-id})))]
    (merge grant
           {:operational-unit
            (va-code-values/get-va-code-value (:operational-unit-id grant))
            :operation
            (va-code-values/get-va-code-value (:operation-id grant))})))

(defn- set-lkp-account [application]
  (assoc application :lkp-account (lkp/get-lkp-account (:answers application))))

(defn get-grant-applications-with-evaluation [grant-id]
  (mapv
    set-lkp-account
    (application-data/get-applications-with-evaluation-by-grant grant-id)))

(defn get-grant-applications [grant-id]
  (application-data/get-applications-with-evaluation-by-grant grant-id))
