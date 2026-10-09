(ns oph.va.virkailija.grant-data
  (:require [oph.soresu.common.db :refer [query-original-identifiers]]
            [oph.va.virkailija.utils :refer [convert-to-dash-keys]]
            [oph.va.virkailija.lkp-templates :as lkp]
            [oph.va.virkailija.va-code-values-data :as va-code-values]
            [oph.va.virkailija.application-data :as application-data]))

(defn get-grant [grant-id]
  (let [grant (convert-to-dash-keys
               (first (query-original-identifiers
                       "SELECT h.id, h.created_at, h.form, h.content, h.status, h.register_number,
                               h.valiselvitysdate, h.loppuselvitysdate, h.form_loppuselvitys,
                               h.form_valiselvitys, h.is_academysize, h.haku_type, h.operational_unit_id,
                               h.allow_visibility_in_external_system, h.arvioitu_maksupaiva,
                               h.loppuselvitys_otantatarkastus_enabled
                        FROM hakija.avustushaut h WHERE h.id = ?"
                       [grant-id])))]
    (merge grant
           {:operational-unit
            (va-code-values/get-va-code-value (:operational-unit-id grant))})))

(defn- set-lkp-account [application]
  (assoc application :lkp-account (lkp/get-lkp-account (:answers application))))

(defn get-grant-applications-with-evaluation [grant-id]
  (mapv
   set-lkp-account
   (application-data/get-applications-with-evaluation-by-grant grant-id)))

(defn get-grant-applications [grant-id]
  (application-data/get-applications-with-evaluation-by-grant grant-id))
