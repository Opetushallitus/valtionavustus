(ns oph.va.virkailija.grant-data
  (:require [oph.soresu.common.db :refer [query-original-identifiers]]
            [oph.va.virkailija.utils :refer [convert-to-dash-keys]]
            [oph.va.virkailija.lkp-templates :as lkp]
            [oph.va.virkailija.va-code-values-data :as va-code-values]
            [oph.va.virkailija.application-data :as application-data]))

(def ^:private get-grants-sql
  "SELECT h.id, h.created_at, h.form, h.status, h.register_number, h.valiselvitysdate,
          h.loppuselvitysdate, h.form_loppuselvitys, h.form_valiselvitys,
          h.is_academysize, h.haku_type, operational_unit_id,
          h.allow_visibility_in_external_system, h.arvioitu_maksupaiva,
          h.loppuselvitys_otantatarkastus_enabled
   FROM hakija.avustushaut h WHERE h.status != 'deleted'")

(def ^:private get-resolved-grants-with-content-sql
  "SELECT h.id, h.created_at, h.form, h.content, h.status, h.register_number,
          h.valiselvitysdate, h.loppuselvitysdate, h.form_loppuselvitys,
          h.form_valiselvitys, h.is_academysize, h.haku_type, h.operational_unit_id,
          h.allow_visibility_in_external_system, h.arvioitu_maksupaiva,
          h.loppuselvitys_otantatarkastus_enabled
   FROM hakija.avustushaut h
   WHERE h.status = 'resolved' OR h.status = 'published'
   ORDER BY h.created_at DESC")

(defn get-grants
  ([content?]
   (let [va-code-values (va-code-values/get-va-code-values)]
     (mapv #(va-code-values/find-grant-code-values
             (convert-to-dash-keys %) va-code-values)
           (query-original-identifiers
            (if content?
              get-resolved-grants-with-content-sql
              get-grants-sql)
            []))))
  ([] (get-grants false)))

(defn get-resolved-grants-with-content []
  (get-grants true))

(def ^:private find-grants-columns
  "SELECT id, created_at, form, content, status, register_number, valiselvitysdate,
          loppuselvitysdate, form_loppuselvitys, form_valiselvitys,
          is_academysize, haku_type, allow_visibility_in_external_system, arvioitu_maksupaiva,
          loppuselvitys_otantatarkastus_enabled
   FROM hakija.avustushaut
   WHERE register_number LIKE ? OR LOWER(content#>>'{name,fi}') LIKE ?")

(defn find-grants [search-term order]
  (let [term (str "%" (clojure.string/lower-case search-term) "%")]
    (mapv convert-to-dash-keys
          (query-original-identifiers
           (str find-grants-columns
                " ORDER BY created_at "
                (if (.endsWith order "desc") "DESC" "ASC"))
           [term term]))))

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
