(ns oph.va.virkailija.va-code-values-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.virkailija.db.queries :as queries]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.va.virkailija.utils :refer
             [convert-to-dash-keys convert-to-underscore-keys]]))

(defn get-va-code-value [id]
  (convert-to-dash-keys
    (first (exec :db queries/get-va-code-value {:id id}))))

(defn get-va-code-values
  ([value-type year]
   (map
     convert-to-dash-keys
     (cond
       (and (some? value-type) (some? year))
       (exec :db queries/get-va-code-values-by-type-and-year
                  {:value_type value-type :year year})
       (some? value-type)
       (exec :db queries/get-current-va-code-values-by-type
                  {:value_type value-type})
       (some? year)
       (exec :db queries/get-va-code-values-by-year
                  {:year year})
       :else
       (exec :db queries/get-current-va-code-values {}))))
  ([] (get-va-code-values nil nil)))

(defn create-va-code-value [values]
  (->> values
      convert-to-underscore-keys
      (exec :db queries/create-va-code-value)
      first
      convert-to-dash-keys))

(defn code-used? [id]
  (-> (exec :db hakija-queries/check-code-usage {:id id})
      first
      :used))

(defn delete-va-code-value! [id]
  (exec :db queries/delete-va-code-value {:id id}))

(defn edit-va-code-value! [id va-code-value]
  (exec :db queries/edit-va-code-value (assoc va-code-value :id id)))

(defn- find-code-by-id [id va-code-values]
  (some #(when (= (:id %) id) (:code %)) va-code-values))

(defn find-grant-code-values [grant va-code-values]
  (merge
    grant
    {:operational-unit (find-code-by-id
                         (:operational-unit-id grant) va-code-values)
     :project (find-code-by-id (:project-id grant) va-code-values)
     :operation (find-code-by-id (:operation-id grant) va-code-values)}))
