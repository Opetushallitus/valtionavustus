(ns oph.va.hakija.grant-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.va.hakija.api :refer [convert-to-dash-keys]]))

(defn get-grants [template]
  (mapv convert-to-dash-keys
        (exec :form-db (if (= template "with-content")
                         hakija-queries/get-grants-with-content
                         hakija-queries/get-grants) {})))

(defn get-grant [grant-id]
  (convert-to-dash-keys
   (first (exec :form-db hakija-queries/get-grant {:grant_id grant-id}))))

(defn get-grant-evaluations [grant-id]
  (mapv convert-to-dash-keys
        (exec :form-db hakija-queries/list-hakemus-paatos-email-statuses
              {:avustushaku_id grant-id})))

(defn- find-evaluation-by-id [col id]
  (first (filter #(= (:hakemus-id %) id) col)))

(defn get-grant-applications-with-evaluation [grant-id]
  (let [evaluations (get-grant-evaluations grant-id)
        convert
        (fn [a]
          (-> a
              convert-to-dash-keys
              (conj
               {:evaluation (find-evaluation-by-id evaluations (:id a))})))]
    (mapv convert
          (exec :form-db hakija-queries/get-grant-applications
                {:grant_id grant-id}))))

(defn get-grant-applications [grant-id]
  (mapv convert-to-dash-keys
        (exec :form-db hakija-queries/get-grant-applications
              {:grant_id grant-id})))
