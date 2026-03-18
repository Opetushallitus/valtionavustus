(ns oph.va.virkailija.va-code-values-data
  (:require [oph.soresu.common.db :refer [execute! named-query query query-original-identifiers]]
            [oph.va.virkailija.utils :refer
             [convert-to-dash-keys convert-to-underscore-keys]]))

(defn get-va-code-value [id]
  (convert-to-dash-keys
   (first (query-original-identifiers
           "SELECT id, value_type, year, code, code_value, hidden
            FROM virkailija.va_code_values
            WHERE deleted IS NULL AND id = ?"
           [id]))))

(defn get-va-code-values
  ([value-type year]
   (map
    convert-to-dash-keys
    (cond
      (and (some? value-type) (some? year))
      (query-original-identifiers
       "SELECT id, value_type, year, code, code_value, hidden
        FROM virkailija.va_code_values
        WHERE value_type = ? AND year = ? AND deleted IS NULL"
       [value-type year])
      (some? value-type)
      (query-original-identifiers
       "SELECT DISTINCT ON (code) id, value_type, year, code, code_value, hidden
        FROM virkailija.va_code_values
        WHERE value_type = ? AND deleted IS NULL
        ORDER BY code, year DESC"
       [value-type])
      (some? year)
      (query-original-identifiers
       "SELECT id, value_type, year, code, code_value, hidden
        FROM virkailija.va_code_values
        WHERE year = ? AND deleted IS NULL"
       [year])
      :else
      (query-original-identifiers
       "SELECT DISTINCT ON (code) id, value_type, year, code, code_value, hidden
        FROM virkailija.va_code_values
        WHERE deleted IS NULL
        ORDER BY code, year DESC"
       []))))
  ([] (get-va-code-values nil nil)))

(defn create-va-code-value [values]
  (->> values
       convert-to-underscore-keys
       (named-query
        "INSERT INTO virkailija.va_code_values (value_type, year, code, code_value)
         VALUES (:value_type, :year, :code, :code_value)
         RETURNING id, value_type, year, code, code_value")
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
  (query-original-identifiers
   "UPDATE virkailija.va_code_values SET deleted = TRUE WHERE id = ? RETURNING id"
   [id]))

(defn edit-va-code-value! [id va-code-value]
  (execute!
   "UPDATE virkailija.va_code_values SET hidden = ? WHERE id = ? RETURNING id"
   [(:hidden va-code-value) id]))

(defn- find-code-by-id [id va-code-values]
  (some #(when (= (:id %) id) (:code %)) va-code-values))

(defn find-grant-code-values [grant va-code-values]
  (merge
   grant
   {:operational-unit (find-code-by-id
                       (:operational-unit-id grant) va-code-values)}))
