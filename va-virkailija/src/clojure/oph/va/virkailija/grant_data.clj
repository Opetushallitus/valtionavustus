(ns oph.va.virkailija.grant-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.virkailija.db.queries :as virkailija-queries]
            [oph.va.virkailija.utils :refer [convert-to-dash-keys]]
            [oph.va.virkailija.lkp-templates :as lkp]))

(defn get-grants []
  (mapv convert-to-dash-keys
        ;; TODO: Problematic: query utilizes join between hakija and virkailija schemas
        (exec :virkailija-db virkailija-queries/get-grants {})))

(defn get-resolved-grants-with-content []
  (mapv convert-to-dash-keys
        ;; TODO: Problematic: query utilizes join between hakija and virkailija schemas
        (exec :virkailija-db virkailija-queries/get-resolved-grants-with-content {})))

(defn get-grant [grant-id]
  (convert-to-dash-keys
   ;; TODO: Problematic: query utilizes join between hakija and virkailija schemas
   (first (exec :virkailija-db virkailija-queries/get-grant {:grant_id grant-id}))))

(defn- set-lkp-account [application]
  (assoc application :lkp-account (lkp/get-lkp-account (:answers application))))

(defn get-grant-applications-with-evaluation [grant-id]
  ;; TODO: Problematic: query utilizes join between hakija and virkailija schemas
  (->> (exec :virkailija-db
             virkailija-queries/get-grant-applications-with-evaluation
             {:grant_id grant-id} )
      (map convert-to-dash-keys)
      (mapv set-lkp-account)))

(defn get-grant-applications [grant-id]
  (mapv convert-to-dash-keys
        ;; TODO: Problematic: query utilizes join between hakija and virkailija schemas
        (exec :virkailija-db virkailija-queries/get-grant-applications
              {:grant_id grant-id})))

(defn get-unpaid-applications [grant-id]
  (mapv convert-to-dash-keys
        ;; TODO: Problematic: query utilizes join between hakija and virkailija schemas
        (exec :virkailija-db virkailija-queries/get-unpaid-applications
              {:grant_id grant-id})))
