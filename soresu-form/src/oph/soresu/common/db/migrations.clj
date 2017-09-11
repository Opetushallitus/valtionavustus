(ns oph.soresu.common.db.migrations
  (:gen-class)
  (:use [clojure.tools.trace :only [trace]]
        [oph.soresu.common.config :only [config]])
  (:require [clojure.tools.logging :as log]
            [oph.soresu.common.db :as db])
  (import [org.flywaydb.core Flyway]
          [org.flywaydb.core.api.migration.jdbc JdbcMigration]
          [org.flywaydb.core.api.migration MigrationInfoProvider]
          [org.flywaydb.core.api MigrationVersion]))

(defn migrate [ds-key-name & migration-paths]
  (let [ds-key (keyword ds-key-name)
        schema-name (-> config ds-key :schema)
        flyway (doto (Flyway.)
                 (.setSchemas (into-array String [schema-name]))
                 (.setDataSource (db/get-datasource ds-key))
                 (.setLocations (into-array String migration-paths)))]
    (try (.migrate flyway)
       (catch Throwable e
         (log/error e)
         (throw e)))))

(defmacro defmigration [name version description & body]
  `(deftype ~name []
            JdbcMigration
     (migrate [this connection]
       ~@body)

            MigrationInfoProvider
     (getDescription [this] ~description)
     (getVersion [this] (MigrationVersion/fromVersion ~version))))
