(ns oph.va.virkailija.va-code-values-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.virkailija.authentication :as authentication]
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
  ([value-type year]
   (map
     convert-to-dash-keys
     (cond
       (and (some? value-type) (some? year))
       (exec :virkailija-db queries/get-va-code-values-by-type-and-year
                  {:value_type value-type :year year})
       (some? value-type)
       (exec :virkailija-db queries/get-current-va-code-values-by-type
                  {:value_type value-type})
       (some? year)
       (exec :virkailija-db queries/get-va-code-values-by-year
                  {:year year})
       :else
       (exec :virkailija-db queries/get-current-va-code-values {})))))

(defn create-va-code-value [values]
  (->> values
      convert-to-underscore-keys
      (exec :virkailija-db queries/create-va-code-value)
      first
      convert-to-dash-keys))

(defn code-used? [id]
  ;; TODO: Move query to va-virkailija/src/clojure/oph/va/hakija/api.clj
  (-> (exec :form-db queries/check-code-usage {:id id})
      first
      :used))

(defn delete-va-code-value! [id]
  (exec :virkailija-db queries/delete-va-code-value {:id id}))
