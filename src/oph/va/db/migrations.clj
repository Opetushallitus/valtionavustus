(ns oph.va.db.migrations
  (import [org.flywaydb.core Flyway])
  (:require [clojure.java.jdbc :refer [db-do-commands]]
            [clojure.tools.logging :as log]
            [yesql.core :refer [defquery]]
            [oph.common.db :as db]))

(defn migrate []
  (let [flyway (doto (Flyway.)
                 (.setDataSource (db/get-datasource)))]
    (try (.migrate flyway)
       (catch Throwable e
         (log/error e)
         (throw e)))))
