(ns oph.va.db
  (:use [oph.va.config :only [config]])
  (:require [clojure.java.jdbc :as jdbc]
            [hikari-cp.core :refer :all]
            [yesql.core :refer [defquery]]
            [oph.va.jdbc.jsonb]))

(def datasource-spec
  "Merge configuration defaults and db config. Latter overrides the defaults"
  (merge {:auto-commit false
          :read-only false
          :connection-timeout 30000
          :validation-timeout 5000
          :idle-timeout 600000
          :max-lifetime 1800000
          :minimum-idle 10
          :maximum-pool-size 10
          :pool-name "db-pool"
          :adapter "postgresql"}
         (:db config)))

(def datasource (future (make-datasource datasource-spec)))

(defquery list-forms "sql/list-forms.sql")
(defquery get-form "sql/get-form.sql")
(defquery submit-form<! "sql/submit-form.sql")

(defn execute-list-forms []
  (jdbc/with-db-transaction [connection {:datasource @datasource}]
    (list-forms {} {:connection connection})))

(defn execute-get-form [id]
  (jdbc/with-db-transaction [connection {:datasource @datasource}]
    (first(get-form {:id id} {:connection connection}))))

(defn execute-submit-form [form, answers]
  (jdbc/with-db-transaction [connection {:datasource @datasource}]
    (:id (submit-form<! {:form form :answers answers} {:connection connection}))))