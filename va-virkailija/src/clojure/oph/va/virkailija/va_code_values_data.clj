(ns oph.va.virkailija.va-code-values-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.virkailija.db.queries :as queries]
            [oph.va.virkailija.utils :refer
             [convert-to-dash-keys convert-to-underscore-keys]]))

(defn has-privilege? [identity privilege]
  (true?
    (some #(= % privilege) (:privileges identity))))

(defmacro with-admin [request form unauthorized]
  `(if (has-privilege?
         (authentication/get-request-identity ~request) "va-admin")
     ~form
     ~unauthorized))

(defn get-va-code-values
  ([value-type]
   (map
     convert-to-dash-keys
     (exec :form-db queries/get-current-va-code-values-by-type
           {:value_type value-type})))
  ([value-type year]
   (map
     convert-to-dash-keys
     (exec :form-db queries/get-va-code-values-by-type-and-year
           {:value_type value-type :year year}))))

(defn create-va-code-value [values]
  (->> values
      convert-to-underscore-keys
      (exec :form-db queries/create-va-code-value)
      first
      convert-to-dash-keys))

(defn code-used? [id]
  (-> (exec :form-db queries/check-code-usage {:id id})
      first
      :used))

(defn delete-va-code-value! [id]
  (exec :form-db queries/delete-va-code-value {:id id}))
