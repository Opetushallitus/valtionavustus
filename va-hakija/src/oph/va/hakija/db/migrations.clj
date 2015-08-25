(ns oph.va.hakija.db.migrations
  (:require [oph.common.db.migrations :as migrations])
  (:gen-class))

(defn migrate [& migration-paths]
  (apply migrations/migrate migration-paths))

;; (defmigration TestMigration "1.4"
;;   "My test migration"
;;   (println "foobar"))
