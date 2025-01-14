(ns oph.va.virkailija.va-code-values-data
  (:require [oph.soresu.common.db :refer [exec query]]
            [oph.va.virkailija.db.queries :as queries]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.va.virkailija.utils :refer
             [convert-to-dash-keys convert-to-underscore-keys]]))

(defn get-va-code-value [id]
  (convert-to-dash-keys
    (first (exec queries/get-va-code-value {:id id}))))

(defn get-va-code-values
  ([value-type year]
   (map
     convert-to-dash-keys
     (cond
       (and (some? value-type) (some? year))
       (exec queries/get-va-code-values-by-type-and-year
                  {:value_type value-type :year year})
       (some? value-type)
       (exec queries/get-current-va-code-values-by-type
                  {:value_type value-type})
       (some? year)
       (exec queries/get-va-code-values-by-year
                  {:year year})
       :else
       (exec queries/get-current-va-code-values {}))))
  ([] (get-va-code-values nil nil)))

(defn create-va-code-value [values]
  (->> values
      convert-to-underscore-keys
      (exec queries/create-va-code-value)
      first
      convert-to-dash-keys))

(defn- operation-unit-code-used? [code-id]
       (let [sql "SELECT count(a.id) > 0 AS used FROM hakija.avustushaut a WHERE a.operational_unit_id = ?"]
            (-> (query sql [code-id]) first :used)))

(defn- project-code-used? [code-id]
       (let [sql "SELECT count(avustushaku_id) > 0 AS used FROM virkailija.avustushaku_project_code WHERE project_id = ?"]
            (-> (query sql [code-id]) first :used)))

(defn code-used? [id]
      (or (operation-unit-code-used? id)
          (project-code-used? id)))

(defn delete-va-code-value! [id]
  (exec queries/delete-va-code-value {:id id}))

(defn edit-va-code-value! [id va-code-value]
  (exec queries/edit-va-code-value (assoc va-code-value :id id)))

(defn- find-code-by-id [id va-code-values]
  (some #(when (= (:id %) id) (:code %)) va-code-values))

(defn find-grant-code-values [grant va-code-values]
  (merge
    grant
    {:operational-unit (find-code-by-id
                         (:operational-unit-id grant) va-code-values) }))
