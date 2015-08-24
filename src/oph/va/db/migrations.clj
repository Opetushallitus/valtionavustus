(ns oph.va.db.migrations
  (:gen-class)
  (:require [clojure.tools.logging :as log]
            [oph.common.db :as db])
  (import [org.flywaydb.core Flyway]
          [org.flywaydb.core.api.migration.jdbc JdbcMigration]
          [org.flywaydb.core.api.migration MigrationInfoProvider]
          [org.flywaydb.core.api MigrationVersion]))

(defn migrate []
  (let [flyway (doto (Flyway.)
                 (.setDataSource (db/get-datasource))
                 (.setLocations (into-array String ["db.migration"
;;                                                  "oph.va.db.migrations"
                                                    ])))]
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

;; (defmigration TestMigration "1.4"
;;   "My test migration"
;;   (println "foobar"))
