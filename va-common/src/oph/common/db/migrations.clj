(ns oph.common.db.migrations
  (:gen-class)
  (:require [clojure.tools.logging :as log]
            [oph.common.db :as db])
  (:use [oph.common.config :only [config]])
  (import [org.flywaydb.core Flyway]
          [org.flywaydb.core.api.migration.jdbc JdbcMigration]
          [org.flywaydb.core.api.migration MigrationInfoProvider]
          [org.flywaydb.core.api MigrationVersion]))

(defn migrate [& migration-paths]
  (let [schema-name (-> config :db :schema)
        flyway (doto (Flyway.)
                 (.setSchemas (into-array String [schema-name]))
                 (.setDataSource (db/get-datasource))
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
