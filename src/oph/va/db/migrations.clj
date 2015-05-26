(ns oph.va.db.migrations
  (import [org.flywaydb.core Flyway])
  (:require [clojure.java.jdbc :refer [db-do-commands]]
            [oph.va.db :as db]))
(defn migrate []
  (let [flyway (doto (Flyway.)
                 (.setDataSource @db/datasource))]
    (.migrate flyway)))