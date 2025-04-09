(ns oph.soresu.common.db.migrations
  (:gen-class)
  (:use [clojure.tools.trace :only [trace]]
        [oph.soresu.common.config :only [config]])
  (:require [clojure.tools.logging :as log]
            [oph.soresu.common.db :as db])
  (:import [org.flywaydb.core Flyway]
           [org.flywaydb.core.api.migration JavaMigration]
           [org.flywaydb.core.api MigrationVersion]))

(defn migrate [schema-name migration-paths]
  (log/info "Running db migrations, if any...")
  (let [config (Flyway/configure)]
    (.schemas config (into-array String [schema-name]))
    (.dataSource config (db/get-datasource))
    (.locations config (into-array String migration-paths))
    (try (.migrate (Flyway. config))
         (catch Throwable e
           (log/error e)
           (throw e)))))

(defmacro defmigration [name version description & body]
  `(deftype ~name []
     JavaMigration
     (migrate [this connection]
       ~@body)

     (getChecksum [this] nil)
     (getDescription [this] ~description)
     (getVersion [this] (MigrationVersion/fromVersion ~version))))
