(ns oph.va.db.migrations
  (import [org.flywaydb.core Flyway])
  (:require [clojure.java.jdbc :refer [db-do-commands]]
            [yesql.core :refer [defquery]]
            [oph.va.db :as db]))

(defquery drop-db! "ddl/drop.sql")

(defn migrate []
  (let [flyway (doto (Flyway.)
                 (.setDataSource @db/datasource))]
    (.migrate flyway)))

(defn exec-drop-db []
  (->> (db/exec drop-db! {})
       println))
