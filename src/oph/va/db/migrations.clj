(ns oph.va.db.migrations
  (import [org.flywaydb.core Flyway])
  (:require [clojure.java.jdbc :refer [db-do-commands]]
            [clojure.tools.logging :as log]
            [yesql.core :refer [defquery]]
            [oph.va.db :as db]))

(defn migrate []
  (let [flyway (doto (Flyway.)
                 (.setDataSource (db/get-datasource)))]
    (.migrate flyway)))
